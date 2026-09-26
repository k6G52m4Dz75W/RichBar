// implementatin of this specific plug-in is here:
//

#include <cstdio>
#include <cstdarg>

#include <WebView2.h>

#define MAX_BUTTON_TITLE	260
#define MAX_TAG_FIELD		260
#define BUTTON_SIZE_SMALL   22
#define BUTTON_SIZE_LARGE   30
#define SIGNATURE_CMD_ARRAY 0x00FE0100

#define MAX_RECENT_FONT		8
#define ID_COMMAND_BASE		100

// RichBar's own live preview: a second custom bar hosting OUR WebView2.
// Unlike the official WebPreview plug-in — whose renderer fetches the
// SAVED file (or the pane-open-time temp snapshot), which is why even its
// right-click Refresh shows stale content — our WebResourceRequested
// handler serves the CURRENT buffer on every fetch, so a reload always
// shows the text as typed
#define WV2_PREVIEW_HOST_CLASS	_T("RichBarPreviewHost")
#define WV2_PREVIEW_BAR_TITLE	_T("RichBar Preview")

#define ZERO_INIT_FIRST_MEM(classname, firstmem)  ZeroMemory( &firstmem, sizeof( classname ) - ((char*)&firstmem - (char*)this) );

INT_PTR CALLBACK NewProc( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam );
LRESULT CALLBACK ToolbarProc( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam );
INT_PTR CALLBACK TableDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam );
INT_PTR CALLBACK PropDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam );
INT_PTR CALLBACK InputParamsDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam );
LRESULT CALLBACK EditProc( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam );
INT_PTR CALLBACK CustomizeDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam );
INT_PTR CALLBACK CustPropDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam );

//extern CDPI g_metrics;

LPCTSTR const szLargeToolbar = _T("LargeToolbar");

#define MAX_SNIPPET_LENGTH 260

#define TOOL_ARG_PATH				0
#define TOOL_ARG_DIR				1
#define TOOL_ARG_FILENAME			2
#define TOOL_ARG_EXT				3
#define TOOL_ARG_CURLINE			4
#define TOOL_ARG_SELTEXT			5
#define TOOL_ARG_DATE				6
#define TOOL_ARG_TIME				7
#define TOOL_ARG_PICK_FULL_PATH		8
#define TOOL_ARG_PICK_RELATIVE_PATH	9
#define TOOL_ARG_PICK_COLOR			10
#define TOOL_ARG_DEF_COLOR			11
#define MAX_TOOL_ARG_NO_INTERFACE	8
#define MAX_TOOL_ARG				12

LPCTSTR const szCustColors = _T("CustColors");

LPCTSTR szToolArgs[MAX_TOOL_ARG] = {
	_T("Path"),
	_T("Dir"),
	_T("Filename"),
	_T("Ext"),
	_T("CurLine"),
	_T("SelText"),
	_T("Date"),
	_T("Time"),
	_T("PickFullPath"),
	_T("PickRelativePath"),
	_T("PickColor"),
	_T("DefColor"),
};

HBITMAP MyLoadBitmap( HINSTANCE hInstance, LPCTSTR lpBitmapName )
{
	return (HBITMAP)LoadImage( hInstance, lpBitmapName, IMAGE_BITMAP, 0, 0, LR_CREATEDIBSECTION );
}

int GetBitmapCount( HBITMAP hbm, int cxUnitWidth )
{
	BITMAP bm = {0};
	VERIFY( GetObject( hbm, sizeof(bm), &bm ) );
	int nNumImages = bm.bmWidth / cxUnitWidth;
	return nNumImages;
}

BOOL StretchBitmap( HBITMAP* phbm, int cxDstImg, int cyDstImg, int cImagesX, int cImagesY )
{
	HBITMAP hbmImage = (HBITMAP)CopyImage( *phbm, IMAGE_BITMAP, cxDstImg * cImagesX, cyDstImg * cImagesY, LR_CREATEDIBSECTION );
	if( hbmImage ){
		VERIFY( DeleteObject( *phbm ) );
		*phbm = hbmImage;
		return TRUE;
	}
	return FALSE;
}

void CenterWindow( HWND hDlg )
{
	RECT myrt, prrt;
	HWND hWndParent = GetParent(hDlg);
	if (!hWndParent || IsIconic(hWndParent)){
		hWndParent = GetDesktopWindow();
	}
	if( GetWindowRect(hWndParent, &prrt) && GetWindowRect(hDlg, &myrt) ){
		SetWindowPos(hDlg, NULL, prrt.left + (((prrt.right - prrt.left) - (myrt.right - myrt.left)) / 2), prrt.top  + (((prrt.bottom - prrt.top) - (myrt.bottom - myrt.top)) / 2), 0, 0, SWP_NOSIZE | SWP_NOZORDER | SWP_NOACTIVATE);
	}
}

WCHAR HexToDec( LPWSTR& p )
{
	WCHAR sz[5];
	WCHAR* po = sz;
	*po++ = *p++;
	if( *p != '\0' ){
		*po++ = *p++;
		if( *p != '\0' ){
			*po++ = *p++;
			if( *p != '\0' ){
				*po++ = *p;
			}
		}
	}
	*po++ = '\0';
	return (WCHAR)wcstoul( sz, NULL, 16 );
}

WCHAR OctToDec( LPWSTR& p )
{
	WCHAR sz[7];
	WCHAR* po = sz;
	*po++ = *p++;
	if( *p != '\0' ){
		*po++ = *p++;
		if( *p != '\0' ){
			*po++ = *p++;
			if( *p != '\0' ){
				*po++ = *p++;
				if( *p != '\0' ){
					*po++ = *p++;
					if( *p != '\0' ){
						*po++ = *p;
					}
				}
			}
		}
	}
	*po++ = '\0';
	return (WCHAR)wcstoul( sz, NULL, 8 );
}


#define CMD_SEPARATOR			0
#define CMD_TAGS				1
#define CMD_INSERT_TABLE		2
#define CMD_FONT				3
#define CMD_UNINDENT			4
#define CMD_DROPDOWN_HEADER		5
#define CMD_DROPDOWN_FORM		6
#define CMD_CUSTOMIZE			7
#define CMD_LINE_PREFIX			8
#define CMD_ICON_COLOR			9
#define CMD_MD_VIEW				10
#define CMD_PREVIEW				12
#define CMD_REFRESH_PREVIEW			12
#define MAX_CMD					13

// built-in EmEditor command IDs and pane flags from the v23/v24.4 plug-in
// SDK (Emurasoft/emeditor-plugin-library plugin.h)
#define EEID_MARKDOWN_VIEW		23255	// Markdown design view toggle
#define EEID_MARKDOWN_PREVIEW	23275	// Markdown rendered preview toggle
#define EI_GET_MARKDOWN_PREVIEW	407		// TRUE if the design view is on
#define EI_SET_MARKDOWN_PREVIEW	408		// sets the design view to (BOOL)lParam (official EE_INFO docs: value-based, not a toggle)
#define EEID_SHOW_MARKDOWN_BAR	23274		// toggles the built-in markdown toolbar
#define EEID_SHOW_MARKDOWN_BAR	23274		// toggles the built-in markdown toolbar

// toolbar mode-switch buttons (command IDs below ID_COMMAND_BASE)
#define ID_MODE_HTML			90
#define ID_MODE_MD				91
// hover-to-open dropdown delay timer (m_hDlg)
#define IDT_HOVER_MENU			1
// state sync (m_hDlg): pane toggles produce no notification, so the
// design-view state is polled and the bar repainted only on change
#define IDT_STARTUP_RESTORE		2
// preview auto-refresh debounce (m_hDlg): one reload after typing pauses
#define IDT_PREVIEW_REFRESH		3
// one-shot markdown-bar correction (m_hDlg): the design toggle
// auto-shows the markdown bar; hide it back if it came up
#define IDT_DESIGN_SYNC			4
// one-shot deferred design-view reconcile (m_hDlg): a 23255 posted during
// the document-switch event lands before the switch settles and misapplies
// runtime-drawn glyphs appended to every toolbar image list
#define MD_ICON_MODE_H			24
#define MD_ICON_MODE_M			25
// logical width of the dropdown marker strip (DPI-scaled); sized so the
// live-drawn arrow keeps clear of the glyph while the button stays compact
#define MD_MARKER_STRIP			8

// glyph colors: light glyphs sit on dark bands, dark glyphs on light ones
// (including the toolbar's light hover/checked fill)
#define GLYPH_COLOR_DARK		RGB( 48, 48, 48 )
#define GLYPH_COLOR_LIGHT		RGB( 224, 224, 224 )

// Pixel heights relative to a 16-pixel icon canvas; large icons use 24.
#define MD_TEXT_HEIGHT		14
#define MD_CODE_HEIGHT		12
#define MD_SUBSCRIPT_HEIGHT	8

#define MODE_HTML				0
#define MODE_MD					1
#define MODE_COUNT				2

class CCmd
{
public:
	int m_iIcon;
	int m_iCmd;
	wstring m_sTitle;
	wstring m_sTagBegin;
	wstring m_sTagEnd;

public:
	CCmd( int iIcon, int iCmd, LPCWSTR pszTitle, LPCWSTR pszTagBegin, LPCWSTR pszTagEnd )
	{
		m_iIcon = iIcon;
		m_iCmd = iCmd;
		if( pszTitle )  m_sTitle = pszTitle;
		if( pszTagBegin )  m_sTagBegin = pszTagBegin;
		if( pszTagEnd )  m_sTagEnd = pszTagEnd;
	}
};

struct CDefCmd
{
	int m_iIcon;
	int m_iCmd;
	int m_nTitleID;
	LPCWSTR m_pszTagBegin;
	LPCWSTR m_pszTagEnd;
};

static WORD SpecialStringID[] = 
{
	ID_TABLE,
	ID_FONT,
	ID_UNINDENT,
	ID_HEADER,
	ID_FORM,
	ID_CUSTOMIZE,
};


static struct CDefCmd DefCmd[] =
{
	{ 0, CMD_DROPDOWN_HEADER, ID_HEADER, L"", L"" },
	{ 1, CMD_TAGS, ID_PARAGRAPH, L"<p>", L"</p>" },
	{ 2, CMD_TAGS, ID_BREAK, L"<br />", L"" },
	{ -1, CMD_SEPARATOR, 0, L"", L"" },
	{ 3, CMD_TAGS, ID_BOLD, L"<strong>", L"</strong>" },
	{ 4, CMD_TAGS, ID_ITALIC, L"<em>", L"</em>" },
	{ 5, CMD_TAGS, ID_UNDERLINE, L"<u>", L"</u>" },
	{ -1, CMD_SEPARATOR, 0, L"", L"" },
	{ 6, CMD_FONT, ID_FONT, L"", L"" },
	{ 7, CMD_TAGS, ID_COLOR, L"\\{PickColor}", L"" },
	//{ 8, CMD_TAGS, ID_PICTURE, L"\\{PickRelativePath,%s,%s}", L"" },
	{ 8, CMD_TAGS, ID_PICTURE, L"<img src=\"\\{PickRelativePath,%s,%s}\" width=\"\" height=\"\" alt=\"\" />", L"" },
	{ 9, CMD_TAGS, ID_HYPERLINK, L"<a href=\"\\{PickRelativePath,%s,%s}\">", L"</a>" },
	{ -1, CMD_SEPARATOR, 0, L"", L"" },
	{ 10, CMD_INSERT_TABLE, ID_TABLE, L"", L"" },
	{ 11, CMD_TAGS, ID_HORZ_LINE, _T("<hr />"), _T("") },
	{ 12, CMD_TAGS, ID_COMMENT, _T("<!-- "), _T(" -->") },
	{ -1, CMD_SEPARATOR, 0, L"", L"" },
	{ 13, CMD_TAGS, ID_ALIGN_LEFT, _T("<p align=\"left\">"), _T("</p>") },
	{ 14, CMD_TAGS, ID_CENTER, _T("<p align=\"center\">"), _T("</p>") },
	{ 15, CMD_TAGS, ID_ALIGN_RIGHT,	_T("<p align=\"right\">"), _T("</p>") },
	{ 16, CMD_TAGS, ID_JUSTIFY, _T("<p align=\"justify\">"), _T("</p>") },
	{ -1, CMD_SEPARATOR, 0, L"", L"" },
	{ 17, CMD_TAGS, ID_NUMBERING, _T("<ol>\n\t<li>"), _T("</li>\n</ol>") },
	{ 18, CMD_TAGS, ID_BULLETS, _T("<ul>\n\t<li>"), _T("</li>\n</ul>") },
	{ 19, CMD_UNINDENT, ID_UNINDENT, L"", L"" },
	{ 20, CMD_TAGS, ID_INDENT, _T("<blockquote>"), _T("</blockquote>") },
	{ -1, CMD_SEPARATOR, 0, L"", L"" },
	{ 21, CMD_TAGS, ID_HIGHLIGHT, _T("<span style=\"background-color: \\{DefColor}\">"), L"</span>" },
	{ 22, CMD_TAGS, ID_FONT_COLOR, _T("<font color=\"\\{DefColor}\">"), L"</font>" },
	{ 23, CMD_DROPDOWN_FORM, ID_FORM, L"", L"" },
	{ -1, CMD_SEPARATOR, 0, L"", L"" },
	{ 48, CMD_ICON_COLOR, ID_ICON_COLOR, L"", L"" },
	{ 49, CMD_PREVIEW, ID_PREVIEW, L"", L"" },
	{ 50, CMD_REFRESH_PREVIEW, ID_REFRESH_PREVIEW, L"", L"" },
	{ 24, CMD_CUSTOMIZE, ID_CUSTOMIZE, L"", L"" },
	{ 25, CMD_TAGS, ID_FORM_FORM, L"<form method=\"post\" action=\"\">\n\t", L"\n<input type=\"submit\"><input type=\"reset\"></form>\n" },
	{ 26, CMD_TAGS, ID_TEXTBOX, L"<input type=\"text\" id=\"\" />", L"" },
	{ 27, CMD_TAGS, ID_PASSWORD, L"<input type=\"password\" id=\"\" />", L"" },
	{ 28, CMD_TAGS, ID_TEXTAREA, L"<textarea id=\"\" rows=\"3\" cols=\"30\">", L"</textarea>" },
	{ 29, CMD_TAGS, ID_CHECKBOX, L"<input type=\"checkbox\" id=\"\" />", L"" },
	{ 30, CMD_TAGS, ID_OPTIONBUTTON, L"<input type=\"radio\" id=\"\" />", L"" },
	{ 31, CMD_TAGS, ID_GROUPBOX, L"<fieldset style=\"padding: 2\">\n<legend>Group Box", L"</legend></fieldset>" },
	{ 32, CMD_TAGS, ID_DROPDOWNBOX, L"<select size=\"1\" id=\"\">", L"</select>" },
	{ 33, CMD_TAGS, ID_LISTBOX, L"<asp:ListBox runat=\"server\" id=\"\">", L"</asp:ListBox>" },
	{ 34, CMD_TAGS, ID_PUSHBUTTON, L"<input type=\"button\" value=\"Button\" id=\"\">", L"" },
	{ 35, CMD_TAGS, ID_ADVANCEDBUTTON, L"<button id=\"\">Type Here", L"</button>" },
	{ 36, CMD_TAGS, ID_HIDDENINPUT, L"<input type=\"hidden\" id=\"\" />", L"" },
	{ 37, CMD_TAGS, ID_OBJECT, L"", L"" },
	{ 38, CMD_TAGS, ID_CAMERA, L"", L"" },
	{ 39, CMD_TAGS, ID_CD, L"", L"" },
	{ 40, CMD_TAGS, ID_SCANNER, L"", L"" },
	{ 41, CMD_TAGS, ID_PRINTER, L"", L"" },
	{ 42, CMD_TAGS, ID_FUNCTION, L"", L"" },
	{ 43, CMD_TAGS, ID_CRITICALERROR, L"", L"" },
	{ 44, CMD_TAGS, ID_WARNING, L"", L"" },
	{ 45, CMD_TAGS, ID_INFORMATION, L"", L"" },
	{ 46, CMD_TAGS, ID_BLUEFLAG, L"", L"" },
	{ 47, CMD_TAGS, ID_BACKGROUNDSOUND, L"", L"" },

};

typedef vector<CCmd> CCmdArray;

// default Markdown button set; icons are indices into the runtime-drawn MD image list
static struct CDefCmdMd {
	int m_iIcon;
	int m_iCmd;
	LPCWSTR m_pszTitle;
	LPCWSTR m_pszTagBegin;
	LPCWSTR m_pszTagEnd;
	int m_nPickStrID;	// IDS_* title for the file-pick parameter, 0 = none
	int m_nPickFilterID;
} MdCmd[] = {
	{  0, CMD_LINE_PREFIX, L"H1", L"# ", L"", 0, 0 },
	{  1, CMD_LINE_PREFIX, L"H2", L"## ", L"", 0, 0 },
	{  2, CMD_LINE_PREFIX, L"H3", L"### ", L"", 0, 0 },
	{  3, CMD_LINE_PREFIX, L"H4", L"#### ", L"", 0, 0 },
	{  4, CMD_LINE_PREFIX, L"H5", L"##### ", L"", 0, 0 },
	{  5, CMD_LINE_PREFIX, L"H6", L"###### ", L"", 0, 0 },
	{ -1, CMD_SEPARATOR, L"", L"", L"", 0, 0 },
	{  6, CMD_TAGS, L"Bold", L"**", L"**", 0, 0 },
	{  7, CMD_TAGS, L"Italic", L"*", L"*", 0, 0 },
	{  8, CMD_TAGS, L"Strikethrough", L"~~", L"~~", 0, 0 },
	{  9, CMD_TAGS, L"Inline Code", L"`", L"`", 0, 0 },
	{ -1, CMD_SEPARATOR, L"", L"", L"", 0, 0 },
	{ 10, CMD_TAGS, L"Code Block", L"```\n", L"\n```", 0, 0 },
	{ 11, CMD_LINE_PREFIX, L"Quote", L"> ", L"", 0, 0 },
	{ -1, CMD_SEPARATOR, L"", L"", L"", 0, 0 },
	{ 12, CMD_LINE_PREFIX, L"Bullet List", L"- ", L"", 0, 0 },
	{ 13, CMD_LINE_PREFIX, L"Numbered List", L"1. ", L"", 0, 0 },
	{ 14, CMD_LINE_PREFIX, L"Task List", L"- [ ] ", L"", 0, 0 },
	{ -1, CMD_SEPARATOR, L"", L"", L"", 0, 0 },
	{ 15, CMD_TAGS, L"Horizontal Line", L"---\n", L"", 0, 0 },
	{ 16, CMD_TAGS, L"Link", L"[", L"](https://)", 0, 0 },
	{ 17, CMD_TAGS, L"Image", L"![", L"](\\{PickRelativePath,%s,%s})", IDS_PICTURE, IDS_FILTER_IMAGE },
	{ 18, CMD_INSERT_TABLE, L"Table", L"", L"", 0, 0 },
	{ -1, CMD_SEPARATOR, L"", L"", L"", 0, 0 },
	{ 20, CMD_ICON_COLOR, L"Icon Color", L"", L"", 0, 0 },
	{ 21, CMD_MD_VIEW, L"Design View", L"", L"", 0, 0 },
	{ 22, CMD_PREVIEW, L"Preview", L"", L"", 0, 0 },
	{ 23, CMD_REFRESH_PREVIEW, L"Refresh Preview", L"", L"", 0, 0 },
	{ 19, CMD_CUSTOMIZE, L"Customize", L"", L"", 0, 0 },
};


class CMyFrame : public CETLFrame<CMyFrame>
{
public:
	// _loc.dll in MUI sub folder?
	enum { _USE_LOC_DLL			= TRUE					};

	// string ID
	enum { _IDS_MENU			= IDS_MENU_TEXT			};   // name of command, menu
	enum { _IDS_STATUS			= IDS_STATUS_MESSAGE	};   // description of command, status bar
	enum { _IDS_NAME			= IDS_MENU_TEXT			};   // name of plug-in, plug-in settings dialog box
	enum { _IDS_VER				= IDS_VERSION			};   // version string of plug-in, plug-in settings dialog box

	// bitmaps
	enum { _IDB_BITMAP			= IDB_BITMAP			};
	enum { _IDB_16C_24			= IDB_16C_24			};
	//enum { _IDB_256C_16_DEFAULT = IDB_TRUE_16_DEFAULT	};
	//enum { _IDB_256C_16_HOT		= IDB_TRUE_16_HOT		};
	//enum { _IDB_256C_16_BW		= IDB_TRUE_16_BW		};
	//enum { _IDB_256C_24_DEFAULT = IDB_TRUE_24_DEFAULT	};
	//enum { _IDB_256C_24_HOT		= IDB_TRUE_24_HOT		};
	//enum { _IDB_256C_24_BW		= IDB_TRUE_24_BW		};
	enum { _IDB_TRUE_16_DEFAULT = IDB_TRUE_16_DEFAULT	};
	enum { _IDB_TRUE_16_HOT		= IDB_TRUE_16_HOT		};
	enum { _IDB_TRUE_16_BW		= IDB_TRUE_16_BW		};
	enum { _IDB_TRUE_24_DEFAULT = IDB_TRUE_24_DEFAULT	};
	enum { _IDB_TRUE_24_HOT		= IDB_TRUE_24_HOT		};
	enum { _IDB_TRUE_24_BW		= IDB_TRUE_24_BW		};

	// masks
	enum { _MASK_TRUE_COLOR		= CLR_NONE				};
	//enum { _MASK_256_COLOR		= CLR_NONE				};

	// whether to allow a file is opened in the same window group during the plug-in execution.
	enum { _ALLOW_OPEN_SAME_GROUP = TRUE				};

	// whether to allow multiple instances.
	enum { _ALLOW_MULTIPLE_INSTANCES = TRUE				};

	// supporting EmEditor newest version * 1000
	enum { _MAX_EE_VERSION		= 14900					};

	// supporting EmEditor oldest version * 1000
	enum { _MIN_EE_VERSION		= 12000					};

	// supports EmEditor Professional
	enum { _SUPPORT_EE_PRO		= TRUE					};

	// supports EmEditor Standard
	enum { _SUPPORT_EE_STD		= FALSE					};

	// user-defined members
	vector<tstring> m_RecentFontArray;
	vector<tstring> m_AutoConfigArray;		// config names switching to HTML mode
	vector<tstring> m_MdConfigArray;		// config names switching to Markdown mode
	CCmdArray m_CmdArray[MODE_COUNT];
	int m_iMode;
	int m_iModeOverride;	// manual mode for the current document (MODE_HTML/MODE_MD), -1 = auto
	COLORREF m_crGlyphFg;	// glyph color the current toolbar image list was drawn with

	vector<wstring> m_asUndefinedParam;
	vector<wstring> m_asUndefinedValue;
	vector<wstring> m_asPickParam;
	vector<wstring> m_asPickValue;

	// data that can be set zeros below
	WNDPROC m_lpOldEditProc;  // common
	CCmd* m_pcmdProp;
	HWND m_hwndToolbar;
	HIMAGELIST m_himageToolbar;
	HIMAGELIST m_himageToolbarHot;
	WNDPROC m_wpOldToolbarProc;	// toolbar subclass chain
	int m_nLightIcons;	// images before the pressed-state dark copies appended below them
	int m_cxImage;		// dropdown button target: cell + arrow strip at the current DPI
	int m_nButtonPad;	// the control's per-button padding: button width - image width
	bool m_bCustomIconColor;	// icon color mode: false = auto (band luminance), true = user color
	COLORREF m_crCustomIcon;	// user-picked icon color for the normal state
	bool m_bIconColorDirty;		// a color setting was touched in the open Prop dialog
	bool m_bDesignViewOn;		// design view toggle state (synced with 407 when it works)
	bool m_bPreviewOn;			// preview pane on (synced to the pane window's visibility)
	HWND m_hwndView;				// the EmEditor VIEW window (plug-in OnCommand contract)
	bool m_bPanesRestored;		// startup pane restore done (first state-sync tick)
	UINT m_nPreviewBarID;		// custom-bar id of the live preview pane
	HWND m_hwndPreviewHost;		// client window adopted by the core bar
	HWND m_hwndWebViewHost;		// inner child the controller binds to (never reparented)
	ICoreWebView2Environment* m_pWV2Env;	// shared WebView2 environment (session-lifetime)
	ICoreWebView2Controller* m_pWV2Controller;
	ICoreWebView2* m_pWV2;
	EventRegistrationToken m_tWV2ResReq;
	bool m_bWV2InitFailed;		// loader/runtime missing: Preview falls back to the official command
	vector<tstring> m_vPreviewDocs;	// documents (by name key) whose preview the user turned ON
	bool m_bWV2InitPending;		// environment creation in flight
	UINT m_nHoverMenuCmd;		// dropdown command waiting for the hover-open timer
	UINT m_nLastMenuCmd;		// dropdown whose menu closed last; reopen only after the mouse leaves it
	bool m_bLastMenuLeft;		// the mouse has left m_nLastMenuCmd since its menu closed
	bool m_bInDropdownMenu;		// a dropdown menu is tracking right now
	HWND m_hDlg;
	TCHAR m_szOldConfig[MAX_CONFIG_NAME];
	DWORD m_dwFindFlags;
	UINT m_nClientID;
	UINT m_cx;
	UINT m_fStyle;
	UINT m_nBand;
	DWORD m_dwDefColor;
	//DWORD m_crCustClr[16];
	WORD  m_wRows;
	WORD  m_wColumns;
	bool m_bProfileLoaded;
	bool m_bAutoDisplay;
	bool m_bVisible;
	bool m_bUninstalling;
	bool m_bPropModified;
	bool m_bPropInitialized;
	bool m_bCmdArrayModified;
	bool m_bOpenStartup;
	bool m_bLargeToolbar;


//////// common start

	BOOL DisableAutoComplete( HWND /* hwnd */ )
	{
		return FALSE;
	}

	BOOL UseDroppedFiles( HWND /* hwnd */ )
	{
		return FALSE;
	}

	LRESULT UserMessage( HWND /*hwnd*/, WPARAM /*wParam*/, LPARAM /*lParam*/ )
	{
		return 0;
	}

	BOOL ChooseFile( LPTSTR pszRelative, LPCTSTR pszDlgTitle, LPCTSTR pszFilter, bool bRelative )
	{
		*pszRelative = 0;
		TCHAR szFile[MAX_PATH] = { 0 };
		TCHAR szFolder[MAX_PATH] = { 0 };
		Editor_DocInfo( m_hWnd, -1, EI_GET_FILE_NAMEW, (LPARAM)szFolder );
		if( szFolder[0] ){
			PathRemoveFileSpec( szFolder );
		}

		OPENFILENAME ofn = { 0 };
		ofn.lStructSize = sizeof( ofn );
		ofn.hwndOwner = m_hWnd;

		TCHAR szFilter[200] = { 0 };
		if( pszFilter ){
			StringCopy( szFilter, _countof( szFilter ), pszFilter );
		}
		LPTSTR p = szFilter;
		while( *p ){
			if( *p == _T('|') )  *p = 0;
			p++;
		}
		ofn.lpstrFilter = szFilter;
		ofn.lpstrFile = szFile;
		ofn.nMaxFile = _countof( szFile );
		ofn.lpstrInitialDir = szFolder;

		ofn.lpstrTitle = pszDlgTitle;
		ofn.Flags = /*OFN_FILEMUSTEXIST | */ OFN_HIDEREADONLY;

		if( GetOpenFileName( &ofn ) ){
			TCHAR szRelativePath[MAX_PATH] = { 0 };
			LPTSTR pRelative = szRelativePath;
			if( !PathRelativePathTo( szRelativePath, szFolder, FILE_ATTRIBUTE_DIRECTORY, szFile, 0 ) ){
				pRelative = szFile;
			}
			else if( _tcsncmp( pRelative, _T(".\\"), 2 ) == 0 ){
				pRelative += 2;
			}

			if( bRelative && PathIsRelative( pRelative ) ) {
				StringCopy( pszRelative, MAX_PATH, pRelative );
			}
			else {
				StringCopy( pszRelative, MAX_PATH, _T("file:///") );
//				StringCat( pszRelative, MAX_PATH, pRelative );
				StringCat( pszRelative, MAX_PATH, szFile );
			}
			p = pszRelative;
			while( *p ){
				if( *p == '\\' )  *p = '/';
				p++;
			}
			return TRUE;
		}
		return FALSE;
	}



	bool ReplaceParam( LPWSTR pszBuf, int cchBuf, LPCWSTR pszParam )
	{
		for( int i = 0; i < MAX_TOOL_ARG_NO_INTERFACE; i++ ){
			if( lstrcmpW( pszParam, szToolArgs[i] ) == 0 ){
				switch( i ){
				case TOOL_ARG_PATH:
					{
						TCHAR sz[MAX_PATH] = { 0 };
						Editor_Info( m_hWnd, EI_GET_FILE_NAMEW, (LPARAM)sz );
						StringCopy( pszBuf, cchBuf, sz );
					}
					break;
				case TOOL_ARG_DIR:
					{
						TCHAR sz[MAX_PATH] = { 0 };
						Editor_Info( m_hWnd, EI_GET_CURRENT_FOLDER, (LPARAM)sz );
						StringCopy( pszBuf, cchBuf, sz );
					}
					break;
				case TOOL_ARG_FILENAME:
					{
						TCHAR sz[MAX_PATH] = { 0 };
						Editor_Info( m_hWnd, EI_GET_FILE_NAMEW, (LPARAM)sz );
						PathStripPathW( sz );
						PathRemoveExtension( sz );
						StringCopy( pszBuf, cchBuf, sz );
					}
					break;
				case TOOL_ARG_EXT:
					{
						TCHAR sz[MAX_PATH] = { 0 };
						Editor_Info( m_hWnd, EI_GET_FILE_NAMEW, (LPARAM)sz );
						LPTSTR pszExt = PathFindExtension( PathFindFileName( sz ) );
						if( *pszExt == '.' ){
							StringCopy( pszBuf, cchBuf, pszExt + 1 );
						}
					}
					break;
				case TOOL_ARG_CURLINE:
					{
						POINT_PTR ptCaret;
						Editor_GetCaretPos( m_hWnd, POS_LOGICAL_W, &ptCaret );
						TCHAR sz[20];
						StringPrintf( sz, _countof( sz ), _T("%d"), ptCaret.y + 1 );
						StringCopy( pszBuf, cchBuf, sz );
					}
					break;
				case TOOL_ARG_SELTEXT:
					{
						Editor_GetSelTextW( m_hWnd, cchBuf, pszBuf );
					}
					break;
				case TOOL_ARG_DATE:
					{
						SYSTEMTIME time;
						GetLocalTime(&time);
						GetDateFormat( LOCALE_USER_DEFAULT, DATE_SHORTDATE, &time, NULL, pszBuf, cchBuf );
					}
					break;
				case TOOL_ARG_TIME:
					{
						SYSTEMTIME time;
						GetLocalTime(&time);
						GetTimeFormat( LOCALE_USER_DEFAULT, TIME_NOSECONDS, &time, NULL, pszBuf, cchBuf );
					}
					break;
				}
				return true;
			}
		}

		if( !m_asUndefinedValue.empty() || !m_asPickValue.empty() ){
			{
				_ASSERT( m_asUndefinedParam.size() == m_asUndefinedValue.size() );
				vector<wstring>::iterator itV = m_asUndefinedValue.begin();
				for( vector<wstring>::iterator it = m_asUndefinedParam.begin(); it != m_asUndefinedParam.end(); it++, itV++ ){
					if( lstrcmpW( pszParam, it->c_str() ) == 0 ){
						StringCopy( pszBuf, cchBuf, itV->c_str() );
						return true;
					}
				}
			}
			{
				_ASSERT( m_asPickParam.size() == m_asPickValue.size() );
				vector<wstring>::iterator itV = m_asPickValue.begin();
				for( vector<wstring>::iterator it = m_asPickParam.begin(); it != m_asPickParam.end(); it++, itV++ ){
					if( lstrcmpW( pszParam, it->c_str() ) == 0 ){
						StringCopy( pszBuf, cchBuf, itV->c_str() );
						return true;
					}
				}
			}
		}
		return false;
	}

	wstring UnescapeString( LPCWSTR szSrc, BOOL* pbResult )
	{
		*pbResult = FALSE;
		_ASSERT( m_asUndefinedParam.empty() );
		_ASSERT( m_asUndefinedValue.empty() );
		m_asUndefinedParam.clear();
		m_asUndefinedValue.clear();

		_ASSERT( m_asPickParam.empty() );
		_ASSERT( m_asPickValue.empty() );
		m_asPickParam.clear();
		m_asPickValue.clear();

		LPWSTR pi = (LPWSTR)szSrc;
		while( *pi != L'\0' ){
			if( *pi == L'\\' ){
				pi++;
				if( *pi == L'{' ){
					LPWSTR pRight = wcschr( pi + 1, L'}' );
					if( pRight ){
						WCHAR szParam[MAX_SNIPPET_LENGTH];
						StringCopyNW( szParam, _countof( szParam ), pi + 1, pRight - (pi + 1) );
						WCHAR szValue[MAX_SNIPPET_LENGTH];
						if( !ReplaceParam( szValue, _countof( szValue ), szParam ) ){
							m_asUndefinedParam.push_back( szParam );
						}
						pi = pRight;
					}
				}
			}
			pi++;
		}

		if( !m_asUndefinedParam.empty() ){
			for( int iParam = 0; iParam < (int)m_asUndefinedParam.size(); iParam++ ){
				WCHAR szCmd[260];
				LPWSTR pDlgTitle = NULL;
				LPWSTR pFilter = NULL;
				StringCopy( szCmd, _countof( szCmd ), m_asUndefinedParam[iParam].c_str() );
				LPWSTR p = wcschr( szCmd, L',' );
				if( p ){
					*p++ = 0;
					pDlgTitle = p;
					p = wcschr( pDlgTitle, L',' );
					if( p ){
						*p++ = 0;
						pFilter = p;
					}
				}

				for( int i = MAX_TOOL_ARG_NO_INTERFACE; i < MAX_TOOL_ARG; i++ ){
					if( lstrcmpW( szCmd, szToolArgs[i] ) == 0 ){
						switch( i ){
						case TOOL_ARG_PICK_FULL_PATH:
						case TOOL_ARG_PICK_RELATIVE_PATH:
							{
								bool bRelative = (i == TOOL_ARG_PICK_RELATIVE_PATH);
								TCHAR szPath[MAX_PATH];
								if( !ChooseFile( szPath, pDlgTitle, pFilter, bRelative ) ){
									m_asUndefinedParam.clear();
									return L"";
								}
								m_asPickParam.push_back( m_asUndefinedParam[iParam].c_str() );
								m_asUndefinedParam.erase( m_asUndefinedParam.begin() + iParam-- );
								m_asPickValue.push_back( szPath );
							}
							break;
						case TOOL_ARG_PICK_COLOR:
							{
								DWORD adwCustomColors[16], adwOrgColors[16];
								for( int j = 0; j < 16; j++ ) {
									adwCustomColors[j] = RGB( 255, 255, 255 );
								}
								GetProfileBinary( EEREG_COMMON, NULL, szCustColors, (LPBYTE)adwCustomColors, sizeof( adwCustomColors ) );
								CopyMemory( adwOrgColors, adwCustomColors, sizeof( adwOrgColors ) );

								CHOOSECOLOR cc = { 0 };
								cc.lStructSize = sizeof( cc );
								cc.hwndOwner = m_hWnd;
								cc.lpCustColors = adwCustomColors;
								if( !ChooseColor( &cc ) ){
									m_asUndefinedParam.clear();
									return L"";
								}
								m_dwDefColor = cc.rgbResult;
								if( memcmp( adwOrgColors, adwCustomColors, sizeof( adwOrgColors ) ) != 0 ) {
									WriteProfileBinary( EEREG_COMMON, NULL, szCustColors, (LPBYTE)adwCustomColors, sizeof( adwCustomColors ), false );
								}

								TCHAR sz[16];
								StringPrintf( sz, _countof( sz ), _T("#%02x%02x%02x"), GetRValue( cc.rgbResult ), GetGValue( cc.rgbResult ), GetBValue( cc.rgbResult ) );
								m_asPickParam.push_back( m_asUndefinedParam[iParam].c_str() );
								m_asUndefinedParam.erase( m_asUndefinedParam.begin() + iParam-- );
								m_asPickValue.push_back( sz );
							}
							break;
						case TOOL_ARG_DEF_COLOR:
							{
								TCHAR sz[16];
								StringPrintf( sz, _countof( sz ), _T("#%02x%02x%02x"), GetRValue( m_dwDefColor ), GetGValue( m_dwDefColor ), GetBValue( m_dwDefColor ) );
								m_asPickParam.push_back( m_asUndefinedParam[iParam].c_str() );
								m_asUndefinedParam.erase( m_asUndefinedParam.begin() + iParam-- );
								m_asPickValue.push_back( sz );
							}
							break;
						}
					}
				}
			}
			if( !m_asUndefinedParam.empty() ){
				if( DialogBox( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE( IDD_INPUT_PARAMS ), m_hWnd, InputParamsDlg ) != IDOK ){
					m_asUndefinedParam.clear();
					m_asPickParam.clear();
					m_asPickValue.clear();
					return L"";
				}
			}
		}

		int cchBuf = MAX_SNIPPET_LENGTH * 4;
		LPWSTR szDest = new WCHAR[ cchBuf ];
		LPWSTR pEnd = szDest + cchBuf;
		LPWSTR po = szDest;
		pi = (LPWSTR)szSrc;
		while( *pi != L'\0' && po < pEnd - 1 ){
			if( *pi == L'\\' ){
				pi++;
				switch( *pi ){
				case L'a': *po = L'\a'; break;
				case L'b': *po = L'\b'; break;
				case L'f': *po = L'\f'; break;
				case L'n': *po = L'\n'; break;
				case L'r': *po = L'\r'; break;
				case L't': *po = L'\t'; break;
				case L'v': *po = L'\v'; break;
				case L'{': 
					{
						LPWSTR pRight = wcschr( pi + 1, L'}' );
						if( pRight ){
							WCHAR szParam[MAX_SNIPPET_LENGTH];
							StringCopyNW( szParam, _countof( szParam ), pi + 1, pRight - (pi + 1) );
							WCHAR szValue[MAX_SNIPPET_LENGTH];
							if( ReplaceParam( szValue, _countof( szValue ), szParam ) ){
								pi = pRight;
								StringCopy( po, pEnd - po, szValue );
								po += lstrlenW( szValue ) - 1;
							}
							else {
								*po = L'{';
							}
						}
						else {
							*po = *pi;
							if( *pi == '\0' ){
								pi--;
								break;
							}
						}
					}
					break;
				case L'x': case L'X':
					pi++;
					*po = HexToDec( pi );
					if( *pi == '\0' ){
						po++;
						goto unescape_exit;
					}
					break;
				default:
					if( *pi >= '0' && *pi <= '9' ){
						*po = OctToDec( pi );
						if( *pi == '\0' ){
							po++;
							goto unescape_exit;
						}
						break;
					}
					else {
						*po = *pi;
						if( *pi == '\0' ){
							pi--;
							break;
						}
					}
				}
				pi++;
				po++;
			}
			else {
				*po++ = *pi++;
			}
		}
	unescape_exit:;
		*po = L'\0';

		wstring sDest = szDest;
		delete [] szDest;

		m_asUndefinedParam.clear();
		m_asUndefinedValue.clear();
		m_asPickParam.clear();
		m_asPickValue.clear();

		*pbResult = TRUE;
		return sDest;
	}

	BOOL OnInputInitDialog( HWND hwnd )
	{
		CenterWindow( hwnd );
		HWND hwndList = GetDlgItem( hwnd, IDC_LIST );
		if( !hwndList )  return TRUE;

		ListView_SetExtendedListViewStyleEx( hwndList, LVS_EX_GRIDLINES | LVS_EX_FULLROWSELECT, LVS_EX_GRIDLINES | LVS_EX_FULLROWSELECT );

		TCHAR sz[80];
		LV_COLUMN lvC = { 0 };
		lvC.mask = LVCF_FMT | LVCF_WIDTH | LVCF_TEXT | LVCF_SUBITEM;
		lvC.pszText = sz;
		RECT rc;
		GetWindowRect( hwndList, &rc );
		lvC.cx = rc.right - rc.left - GetSystemMetrics( SM_CXVSCROLL ) - GetSystemMetrics( SM_CXEDGE ) * 2 - 80;
		LoadString( EEGetLocaleInstanceHandle(), IDS_VALUE, sz, _countof( sz ) );
		VERIFY( ListView_InsertColumn( hwndList, 0, &lvC ) != -1 );

		lvC.cx = 80;
		LoadString( EEGetLocaleInstanceHandle(), IDS_PARAMETER, sz, _countof( sz ) );
		VERIFY( ListView_InsertColumn( hwndList, 1, &lvC ) != -1 );

		int anOrder[2] = { 1, 0 };
		ListView_SetColumnOrderArray( hwndList, 2, anOrder );

		int i = 0;
		for( vector<wstring>::iterator it = m_asUndefinedParam.begin(); it != m_asUndefinedParam.end(); it++, i++ ){
			LVITEM item = { 0 };
			item.mask = LVIF_TEXT;
			item.iItem = i;
			item.pszText = L"";
			ListView_InsertItem( hwndList, &item );
			item.iSubItem = 1;
			item.pszText = (LPWSTR)it->c_str();
			ListView_SetItem( hwndList, &item );
		}

		ListView_SetItemState( hwndList, 0, LVIS_SELECTED | LVIS_FOCUSED, LVIS_SELECTED | LVIS_FOCUSED );
		SetFocus( hwndList );
		ListView_EditLabel( hwndList, 0 );

		return FALSE;
	}

	void OnInputDlgCommand( HWND hwnd, WPARAM wParam )
	{
		if( wParam == IDOK ){
			_ASSERT( m_asUndefinedValue.empty() );
			HWND hwndList = GetDlgItem( hwnd, IDC_LIST );
			if( !hwndList )  return;
			int nCount = (int)m_asUndefinedParam.size();
			for( int i = 0; i < nCount; i++ ) {
				TCHAR szText[260];
				ListView_GetItemText( hwndList, i, 0, szText, _countof( szText ) );
				if( szText[0] == 0 ){
					m_asUndefinedValue.clear();
					SetFocus( hwndList );
					ListView_EditLabel( hwndList, i );
					return;
				}
				m_asUndefinedValue.push_back( szText );
			}
			EndDialog( hwnd, IDOK );
		}
		else if( wParam == IDCANCEL ){
			m_asUndefinedValue.clear();
			_ASSERT( m_asUndefinedValue.empty() );
			EndDialog( hwnd, IDCANCEL );
		}
	}

	BOOL OnInputDlgNotify( HWND hwnd, int idCtrl, LPNMHDR pnmh )
	{
		BOOL bResult = FALSE;
		if( idCtrl == IDC_LIST ){
			switch( pnmh->code ){
			case LVN_BEGINLABELEDIT:
				{
					HWND hwndList = GetDlgItem( hwnd, IDC_LIST );
					HWND hwndEdit = ListView_GetEditControl( hwndList );
					if( hwndEdit ){
						_ASSERTE( m_lpOldEditProc == NULL );
						m_lpOldEditProc = (WNDPROC)SetWindowLongPtr( hwndEdit, GWLP_WNDPROC, (LONG_PTR)EditProc );
					}

				}
				break;
			case LVN_ENDLABELEDIT:
				{
					HWND hwndList = GetDlgItem( hwnd, IDC_LIST );
					NMLVDISPINFO* pdi = (NMLVDISPINFO*)pnmh;
					if( m_lpOldEditProc != NULL ){
						HWND hwndEdit = ListView_GetEditControl( hwndList );
						_ASSERT( hwndEdit );
						if( hwndEdit ){
							SetWindowLongPtr( hwndEdit, GWLP_WNDPROC, (LONG_PTR)m_lpOldEditProc );
							m_lpOldEditProc = NULL;
						}
					}
					if( pdi->item.pszText != NULL ){
						bResult = TRUE;
						SetWindowLongPtr( hwnd, DWLP_MSGRESULT, bResult );
					}
				}
				break;

			case LVN_KEYDOWN:
				{
					HWND hwndList = GetDlgItem( hwnd, IDC_LIST );
					LV_KEYDOWN* pLVKeyDow = (LV_KEYDOWN*)pnmh;
					if( pLVKeyDow->wVKey == VK_F2 ){
						int iItem = ListView_GetNextItem( hwndList, -1, LVNI_SELECTED );
						if( iItem >= 0 ){
							VERIFY( ListView_EditLabel( hwndList, iItem ) );
						}
					}

				}
				break;

			}
		}
		return bResult;
	}

	void OnEditKeyDown( HWND hwnd, WPARAM wParam, LPARAM /*lParam*/ )
	{
		if( wParam == VK_DOWN || wParam == VK_UP ){
			HWND hwndList = GetParent( hwnd );
			int iSel = ListView_GetNextItem( hwndList, -1, LVNI_SELECTED );
			_ASSERT( iSel >= 0 );
			if( wParam == VK_DOWN ){
				iSel++;
			}
			else {
				iSel--;
			}
			if( iSel == ListView_GetItemCount( hwndList ) ){
				HWND hDlg = GetParent( hwndList );
				_ASSERT( hDlg );
				SendMessage( hDlg, WM_NEXTDLGCTL, 0, 0 );
				return;
			}
			if( iSel >= 0 && iSel < ListView_GetItemCount( hwndList ) ){
				ListView_EditLabel( hwndList, iSel );
			}
		}
	}

//////// common end

	BOOL LoadCmdArray( int iMode )
	{
		BOOL bResult = FALSE;
		LPCTSTR pszKey = ( iMode == MODE_MD ) ? _T("CmdArray1") : _T("CmdArray0");
		m_CmdArray[iMode].clear();
		DWORD dwCount = GetProfileBinary( pszKey, NULL, 0 );
		if( dwCount ){
			char* pBuf = new char[ dwCount ];
			if( pBuf ){
				if( GetProfileBinary( pszKey, (LPBYTE)pBuf, dwCount ) ){
					int nMax, nLen, iCmd, iIcon;
					char* p = pBuf;
					DWORD dwSign = *((DWORD*)p);
					p += sizeof( DWORD );
					if( dwSign == SIGNATURE_CMD_ARRAY )	{
						nMax = *((int*)p);
						p += sizeof( int );
						for( int i = 0; i < nMax; i ++ ){
							iCmd = *((int*)p);
							p += sizeof( int );
							iIcon = *((int*)p);
							p += sizeof( int );

							nLen = *((int*)p);
							p += sizeof( int );
							wstring sTitle( (LPCWSTR)p, nLen );
							p += nLen * sizeof(WCHAR);

							nLen = *((int*)p);
							p += sizeof( int );
							wstring sTagBegin( (LPCWSTR)p, nLen );
							p += nLen * sizeof(WCHAR);

							nLen = *((int*)p);
							p += sizeof( int );
							wstring sTagEnd( (LPCWSTR)p, nLen );
							p += nLen * sizeof(WCHAR);

							CCmd cmd( iIcon, iCmd, sTitle.c_str(), sTagBegin.c_str(), sTagEnd.c_str() );
							m_CmdArray[iMode].push_back( cmd );
						}
						_ASSERT( p == pBuf + dwCount );
						bResult = ( p == pBuf + dwCount );
					}
				}
				delete [] pBuf;
			}
		}
		if( bResult ){
			// migration: arrays saved by older versions predate newer
			// functional buttons; splice any missing ones in before the
			// customize entry and persist so it sticks. Design View exists
			// in Markdown mode only (and is removed from HTML arrays saved
			// by 0.20.0, which added it to both)
			struct NewButton { int iCmd; int iIcon; LPCWSTR pszTitle; bool bMdOnly; };
			const NewButton aNew[] = {
				{ CMD_ICON_COLOR, ( iMode == MODE_MD ) ? 20 : 48, L"Icon Color", false },
				{ CMD_MD_VIEW,    ( iMode == MODE_MD ) ? 21 : 0,  L"Design View", true },
				{ CMD_PREVIEW,    ( iMode == MODE_MD ) ? 22 : 49, L"Preview", false },
			};
			bool bInserted = false;
			int iAt = (int)m_CmdArray[iMode].size();
			for( int i = 0; i < (int)m_CmdArray[iMode].size(); i++ ){
				if( m_CmdArray[iMode][i].m_iCmd == CMD_CUSTOMIZE ){ iAt = i; break; }
			}
			for( auto& nb : aNew ){
				if( nb.bMdOnly && iMode != MODE_MD )  continue;
				bool bFound = false;
				for( const auto& cmd : m_CmdArray[iMode] ){
					if( cmd.m_iCmd == nb.iCmd ){ bFound = true; break; }
				}
				if( !bFound ){
					CCmd cmd( nb.iIcon, nb.iCmd, nb.pszTitle, L"", L"" );
					m_CmdArray[iMode].insert( m_CmdArray[iMode].begin() + iAt, cmd );
					iAt++;
					bInserted = true;
				}
			}
			if( iMode != MODE_MD ){
				for( int i = (int)m_CmdArray[iMode].size() - 1; i >= 0; i-- ){
					if( m_CmdArray[iMode][i].m_iCmd == CMD_MD_VIEW ){
						m_CmdArray[iMode].erase( m_CmdArray[iMode].begin() + i );
						bInserted = true;
					}
				}
			}
			if( bInserted && iMode == m_iMode ){
				m_bCmdArrayModified = true;
				SaveCmdArray();
			}
		}
		return bResult;
	}

	void SaveCmdArray()
	{
		if( m_bCmdArrayModified ){
			int iMode = m_iMode;
			int nLen;
			BOOL bSuccess = FALSE;
			DWORD_PTR dwCount = sizeof( int );
			dwCount += sizeof(DWORD);
			CCmdArray& arr = m_CmdArray[iMode];
			CCmdArray::iterator it = arr.begin();
			int nMax = 0;
			while( it != arr.end() ){
				dwCount += (it->m_sTagBegin.length() + it->m_sTagEnd.length() + it->m_sTitle.length()) * sizeof(WCHAR) + 5 * sizeof( int );
				nMax++;
				it++;
			}
			char *pBuf;
			pBuf = new char[dwCount];
			if( pBuf != NULL ){
				TCHAR szKey[40];
				StringPrintf( szKey, _countof( szKey ), _T("CmdArray%d"), iMode );
				char* p = pBuf;
				*((DWORD*)p) = SIGNATURE_CMD_ARRAY;
				p += sizeof( DWORD );
				*((int*)p) = nMax;
				p += sizeof( int );
				it = arr.begin();
				while( it != arr.end() ){
					*((int*)p) = it->m_iCmd;
					p += sizeof( int );
					*((int*)p) = it->m_iIcon;
					p += sizeof( int );

					nLen = (int)it->m_sTitle.length();
					*((int*)p) = nLen;
					p += sizeof( int );
					memcpy( p, it->m_sTitle.c_str(), nLen * sizeof(WCHAR) );
					p += nLen * sizeof(WCHAR);

					nLen = (int)it->m_sTagBegin.length();
					*((int*)p) = nLen;
					p += sizeof( int );
					memcpy( p, it->m_sTagBegin.c_str(), nLen * sizeof(WCHAR) );
					p += nLen * sizeof(WCHAR);

					nLen = (int)it->m_sTagEnd.length();
					*((int*)p) = nLen;
					p += sizeof( int );
					memcpy( p, it->m_sTagEnd.c_str(), nLen * sizeof(WCHAR) );
					p += nLen * sizeof(WCHAR);

					it++;
				}
				_ASSERT( p == pBuf + dwCount );
				bSuccess = ( p == pBuf + dwCount );
				WriteProfileBinary( szKey, (LPBYTE)pBuf, (UINT)dwCount, true );
				delete [] pBuf;
			}
		}
	}


	void InsertCmdAt( int iMode, int iPos, int iIcon, int iCmd, LPCWSTR pszTitle, LPCWSTR pszTagBegin, LPCWSTR pszTagEnd )
	{
		CCmd cmd( iIcon, iCmd, pszTitle, pszTagBegin, pszTagEnd );
		m_CmdArray[iMode].insert( m_CmdArray[iMode].begin() + iPos, cmd );
	}

	void ResetCmdArray( int iMode )
	{
		m_CmdArray[iMode].clear();
		if( iMode == MODE_MD ){
			for( int i = 0; i < _countof( MdCmd ); i++ ){
				TCHAR szTagBegin[300], szTagEnd[300];
				if( MdCmd[i].m_nPickStrID != 0 ){
					// format the file-pick parameter with the localized dialog title and filter
					TCHAR szDlgTitle[80], szFilter[200];
					LoadString( EEGetLocaleInstanceHandle(), MdCmd[i].m_nPickStrID, szDlgTitle, _countof( szDlgTitle ) );
					LoadString( EEGetLocaleInstanceHandle(), MdCmd[i].m_nPickFilterID, szFilter, _countof( szFilter ) );
					if( wcschr( MdCmd[i].m_pszTagBegin, L'%' ) ){
						StringPrintf( szTagBegin, _countof( szTagBegin ), MdCmd[i].m_pszTagBegin, szDlgTitle, szFilter );
						StringCopy( szTagEnd, _countof( szTagEnd ), MdCmd[i].m_pszTagEnd );
					}
					else {
						StringCopy( szTagBegin, _countof( szTagBegin ), MdCmd[i].m_pszTagBegin );
						StringPrintf( szTagEnd, _countof( szTagEnd ), MdCmd[i].m_pszTagEnd, szDlgTitle, szFilter );
					}
				}
				else {
					StringCopy( szTagBegin, _countof( szTagBegin ), MdCmd[i].m_pszTagBegin );
					StringCopy( szTagEnd, _countof( szTagEnd ), MdCmd[i].m_pszTagEnd );
				}
				InsertCmdAt( iMode, i, MdCmd[i].m_iIcon, MdCmd[i].m_iCmd, MdCmd[i].m_pszTitle, szTagBegin, szTagEnd );
			}
		}
		else {
			for( int i = 0; i < _countof( DefCmd ); i++ ){
				WCHAR sz[80];
				LoadString( EEGetLocaleInstanceHandle(), DefCmd[i].m_nTitleID, sz, _countof( sz ) );
				TCHAR szTagBegin[300];
				if( DefCmd[i].m_nTitleID == ID_PICTURE || DefCmd[i].m_nTitleID == ID_HYPERLINK ){
					bool bHyperlink = DefCmd[i].m_nTitleID == ID_HYPERLINK;
					TCHAR szDlgTitle[80], szFilter[200];
					LoadString( EEGetLocaleInstanceHandle(), bHyperlink ? IDS_HYPERLINK : IDS_PICTURE, szDlgTitle, _countof( szDlgTitle ) );
					LoadString( EEGetLocaleInstanceHandle(), bHyperlink ? IDS_FILTER_HYPERLINK : IDS_FILTER_IMAGE, szFilter, _countof( szFilter ) );
					StringPrintf( szTagBegin, _countof( szTagBegin ), DefCmd[i].m_pszTagBegin, szDlgTitle, szFilter );
				}
				else {
					StringCopy( szTagBegin, _countof( szTagBegin ), DefCmd[i].m_pszTagBegin );
				}
				InsertCmdAt( iMode, i, DefCmd[i].m_iIcon, DefCmd[i].m_iCmd, sz, szTagBegin, DefCmd[i].m_pszTagEnd );
				if( DefCmd[i].m_iCmd == CMD_CUSTOMIZE )  break;
			}
		}
		EraseEntry( ( iMode == MODE_MD ) ? _T("CmdArray1") : _T("CmdArray0") );
		if( iMode == m_iMode ){
			m_bCmdArrayModified = false;
		}
	}

	void AddButtons( HWND hwndToolbar )
	{
		for( ;; ){
			if( !SendMessage( hwndToolbar, TB_DELETEBUTTON, 0, 0 ) ){
				break;
			}
		}

		size_t nCmd = m_CmdArray[m_iMode].size();
		TBBUTTON* atb = new TBBUTTON[ nCmd + 3 ];
		ZeroMemory( atb, sizeof( TBBUTTON ) * ( nCmd + 3 ) );

		// manual mode switch: [H][M] | separator | command buttons;
		// the checked side shows the effective mode and doubles as its indicator
		int nIcons = m_nLightIcons;	// excludes the pressed-state dark copies
		if( nIcons <= 0 && m_himageToolbar ){
			nIcons = ImageList_GetImageCount( m_himageToolbar );
		}
		atb[0].iBitmap = max( 0, nIcons - 2 );
		atb[0].idCommand = ID_MODE_HTML;
		atb[0].fsState = TBSTATE_ENABLED | ( ( m_iMode == MODE_HTML ) ? TBSTATE_CHECKED : 0 );
		atb[0].fsStyle = BTNS_CHECK | BTNS_GROUP;
		atb[1].iBitmap = max( 0, nIcons - 1 );
		atb[1].idCommand = ID_MODE_MD;
		atb[1].fsState = TBSTATE_ENABLED | ( ( m_iMode == MODE_MD ) ? TBSTATE_CHECKED : 0 );
		atb[1].fsStyle = BTNS_CHECK | BTNS_GROUP;
		atb[2].iBitmap = 4;
		atb[2].fsState = TBSTATE_ENABLED;
		atb[2].fsStyle = TBSTYLE_SEP;

		int i = 0;
		for( CCmdArray::iterator it = m_CmdArray[m_iMode].begin(); it != m_CmdArray[m_iMode].end(); it++, i++ ) {
			atb[i + 3].iBitmap = it->m_iIcon;
			atb[i + 3].idCommand = i + ID_COMMAND_BASE;
			atb[i + 3].fsState = TBSTATE_ENABLED;
			atb[i + 3].fsStyle = 0;
			if( it->m_iCmd == CMD_SEPARATOR ){
				atb[i + 3].fsStyle = TBSTYLE_SEP;
			}
			// Design View / Preview are INDEPENDENT check toggles: plain BTNS_CHECK.
			// No BTNS_GROUP — that is radio semantics (clicking one unchecks
			// the sibling), which these two must not share; [H][M] keep GROUP
			// because the modes are exclusive
			if( it->m_iCmd == CMD_MD_VIEW || it->m_iCmd == CMD_PREVIEW ){
				atb[i + 3].fsStyle = BTNS_CHECK;
			}
			// Dropdown commands keep the dropdown behavior: the whole button
			// sends TBN_DROPDOWN. The toolbar deliberately lacks
			// TBSTYLE_EX_DRAWDDARROWS, so the control draws no arrow — the
			// arrow is drawn live at paint time, anchored to the button's
			// actual rect (see DrawDropdownArrow / NM_CUSTOMDRAW).
			if( IsDropdownCmdCode( it->m_iCmd ) ){
				atb[i + 3].fsStyle = BTNS_DROPDOWN;
			}

		}

		SendMessage( hwndToolbar, TB_ADDBUTTONSA, (WPARAM)( nCmd + 3 ), (LPARAM)atb );
		// Dropdown buttons widen by the arrow strip so the live-drawn arrow
		// has room beside the glyph; this is purely for space — the arrow
		// itself anchors to the real button rect at paint time, so the
		// layout stays correct even if the control rounds the width.
		int iPlain = -1;
		for( size_t k = 0; k < nCmd; k++ ){
			if( m_CmdArray[m_iMode][k].m_iCmd != CMD_SEPARATOR && !IsDropdownCmdCode( m_CmdArray[m_iMode][k].m_iCmd ) ){
				iPlain = (int)k;
				break;
			}
		}
		if( iPlain >= 0 ){
			RECT rc = {};
			if( SendMessage( hwndToolbar, TB_GETITEMRECT, (WPARAM)( iPlain + 3 ), (LPARAM)&rc ) ){
				int ilcx = 0, ilcy = 0;
				if( m_himageToolbar ){
					ImageList_GetIconSize( m_himageToolbar, &ilcx, &ilcy );
				}
				m_nButtonPad = max( 0, (int)( rc.right - rc.left ) - ilcx );
			}
		}
		TBBUTTONINFO bi = {};
		bi.cbSize = sizeof( bi );
		bi.dwMask = TBIF_SIZE;
		bi.cx = (UINT)( m_cxImage + m_nButtonPad );
		for( size_t k = 0; k < nCmd; k++ ){
			if( IsDropdownCmdCode( m_CmdArray[m_iMode][k].m_iCmd ) ){
				SendMessage( hwndToolbar, TB_SETBUTTONINFO, (WPARAM)( k + ID_COMMAND_BASE ), (LPARAM)&bi );
			}
		}
		delete [] atb;
	}

	bool IsVisible()
	{
		return m_hwndToolbar && m_bVisible;
	}


	void CheckToolbarSize()
	{
		DWORD dwValue = 0;
		DWORD dwSize = sizeof(DWORD);
		Editor_RegQueryValue( m_hWnd, EEREG_COMMON, NULL, szLargeToolbar, REG_DWORD, (BYTE*)&dwValue, &dwSize, 0 );
		m_bLargeToolbar = !!dwValue;
	}

	HBITMAP CreateMdIconBitmap( int cx, int cy, void** ppvBits )
	{
		BITMAPINFO bmi;
		ZeroMemory( &bmi, sizeof( bmi ) );
		bmi.bmiHeader.biSize = sizeof( BITMAPINFOHEADER );
		bmi.bmiHeader.biWidth = cx;
		bmi.bmiHeader.biHeight = -cy;	// top-down
		bmi.bmiHeader.biPlanes = 1;
		bmi.bmiHeader.biBitCount = 32;
		bmi.bmiHeader.biCompression = BI_RGB;
		void* pvBits = NULL;
		HBITMAP hbm = CreateDIBSection( NULL, &bmi, DIB_RGB_COLORS, &pvBits, NULL, 0 );
		if( hbm && pvBits ){
			// fill with the transparency key color; converted to alpha 0 after drawing
			for( int i = 0; i < cx * cy; i++ ){
				( (DWORD*)pvBits )[i] = 0x00FF00FF;	// magenta key, alpha 0
			}
		}
		*ppvBits = pvBits;
		return hbm;
	}

	void MdKeyOutBackground( int cx, int cy, void* pvBits )
	{
		if( !pvBits )  return;
		for( int i = 0; i < cx * cy; i++ ){
			DWORD dw = ( (DWORD*)pvBits )[i];
			if( ( dw & 0x00FFFFFF ) == 0x00FF00FF ){
				( (DWORD*)pvBits )[i] = 0x00000000;	// transparent
			}
			else {
				( (DWORD*)pvBits )[i] = dw | 0xFF000000;	// opaque
			}
		}
	}

	// Shared by all frames; release only on normal plug-in shutdown, outside DllMain.
	static HANDLE& MdIconFontResource()
	{
		static HANDLE s_hFontResource = NULL;
		return s_hFontResource;
	}

	static bool MdIconFontInstall()
	{
		HANDLE& hFontResource = MdIconFontResource();
		if( hFontResource ){
			return true;
		}
		HINSTANCE hInstance = EEGetInstanceHandle();
		HRSRC hres = FindResource( hInstance, MAKEINTRESOURCE( IDR_ICON_FONT ), RT_RCDATA );
		if( !hres ){
			return false;
		}
		HGLOBAL hglobal = LoadResource( hInstance, hres );
		if( !hglobal ){
			return false;
		}
		const void* pvData = LockResource( hglobal );
		DWORD dwSize = SizeofResource( hInstance, hres );
		if( !pvData || !dwSize ){
			return false;
		}
		DWORD dwNumFonts = 0;
		HANDLE hFont = AddFontMemResourceEx( (PVOID)pvData, dwSize, NULL, &dwNumFonts );
		if( !hFont || dwNumFonts == 0 ){
			if( hFont ) RemoveFontMemResourceEx( hFont );
			return false;
		}
		hFontResource = hFont;
		return true;
	}

	static void ReleaseMdIconFont()
	{
		HANDLE& hFontResource = MdIconFontResource();
		if( hFontResource ){
			RemoveFontMemResourceEx( hFontResource );
			hFontResource = NULL;
		}
	}

	static HFONT GetMdIconFont( int cx )
	{
		if( !MdIconFontInstall() ) return NULL;
		return CreateFontW( -cx, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
			DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, ANTIALIASED_QUALITY,
			FF_DONTCARE, L"remixicon" );
	}

	void DrawMdText( HDC hdc, int cx, LPCWSTR pszText, int nBaseHeight, int nWeight, bool bItalic, COLORREF crFg )
	{
		HFONT hfont = CreateFontW( -MulDiv( nBaseHeight, cx, 16 ), 0, 0, 0, nWeight, bItalic, FALSE, FALSE,
			DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, ANTIALIASED_QUALITY, FF_DONTCARE, L"Segoe UI" );
		HFONT hfontOld = (HFONT)SelectObject( hdc, hfont );
		SetBkMode( hdc, TRANSPARENT );
		SetTextColor( hdc, crFg );
		RECT rc = { 0, 0, cx, cx };
		DrawTextW( hdc, pszText, -1, &rc, DT_CENTER | DT_VCENTER | DT_SINGLELINE | DT_NOPREFIX );
		SelectObject( hdc, hfontOld );
		DeleteObject( hfont );
	}

	void DrawMdTextAt( HDC hdc, int x, int y, LPCWSTR pszText, int nHeight, int nWeight, COLORREF crFg )
	{
		HFONT hfont = CreateFontW( -nHeight, 0, 0, 0, nWeight, FALSE, FALSE, FALSE,
			DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, ANTIALIASED_QUALITY, FF_DONTCARE, L"Segoe UI" );
		HFONT hfontOld = (HFONT)SelectObject( hdc, hfont );
		SetBkMode( hdc, TRANSPARENT );
		SetTextColor( hdc, crFg );
		TextOutW( hdc, x, y, pszText, (int)wcslen( pszText ) );
		SelectObject( hdc, hfontOld );
		DeleteObject( hfont );
	}

	BOOL DrawIconGlyph( HDC hdc, int cx, WCHAR ch, COLORREF crFg, int cxRect = 0 )
	{
		// cx sets the font em (and the default square rect); cxRect > cx only
		// widens the drawing rect, centering the same-size glyph on the wider
		// image canvas
		if( cxRect <= 0 ){
			cxRect = cx;
		}
		HFONT hfontIcon = GetMdIconFont( cx );
		if( !hfontIcon ) return FALSE;
		BOOL drawn = FALSE;
		HFONT old = (HFONT)SelectObject( hdc, hfontIcon );
		if( old && old != (HFONT)HGDI_ERROR ){
			WCHAR face[LF_FACESIZE] = {};
			WORD index = 0xFFFF;
			if( GetTextFaceW( hdc, _countof( face ), face ) && lstrcmpiW( face, L"remixicon" ) == 0 &&
				GetGlyphIndicesW( hdc, &ch, 1, &index, GGI_MARK_NONEXISTING_GLYPHS ) != GDI_ERROR &&
				index != 0 && index != 0xFFFF ){
				SetBkMode( hdc, TRANSPARENT );
				SetTextColor( hdc, crFg );
				RECT rc = { 0, 0, cxRect, cx };
				drawn = DrawTextW( hdc, &ch, 1, &rc, DT_CENTER | DT_VCENTER | DT_SINGLELINE ) != 0;
			}
			SelectObject( hdc, old );
		}
		DeleteObject( hfontIcon );
		return drawn;
	}

	void DrawMdIcon( HDC hdc, int cx, int iIcon, COLORREF crFg, int cxRect = 0 )
	{
		HPEN hpen = CreatePen( PS_SOLID, max( 1, cx / 16 ), crFg );
		HPEN hpenOld = (HPEN)SelectObject( hdc, hpen );
		HBRUSH hbrOld = (HBRUSH)SelectObject( hdc, GetStockObject( NULL_BRUSH ) );

		// Codepoints are tied to the bundled Lucide subset; see docs/lucide-font.md.
		struct IconGlyph { int iIcon; wchar_t wch; };
		static const IconGlyph c_aIconGlyphs[] = {
			{ 0, 0xEDE6 },		// h-1
			{ 1, 0xEDE7 },		// h-2
			{ 2, 0xEDE8 },		// h-3
			{ 3, 0xEDE9 },		// h-4
			{ 4, 0xEDEA },		// h-5
			{ 5, 0xEDEB },		// h-6
			{ 6, 0xEAD1 },		// bold
			{ 7, 0xEE6B },		// italic
			{ 8, 0xF1AB },		// strikethrough
			{ 9, 0xEBAD },		// code-s-slash-line (inline code)
			{ 10, 0xEBA7 },		// code-box-line (fenced code block)
			{ 11, 0xEC51 },		// double-quotes-l (block quote)
			{ 12, 0xEEBE },		// list-unordered (bullet list)
			{ 13, 0xEEBB },		// list-ordered
			{ 14, 0xEEB9 },		// list-check-2 (task list)
			{ 15, 0xF1AF },		// subtract-line (horizontal rule)
			{ 16, 0xEEB8 },		// links-line (link)
			{ 17, 0xEE4B },		// image-line
			{ 18, 0xF1DE },		// table-line
			{ 19, 0xF0EE },		// settings-line (customize)
			{ 20, 0xF42E },		// color-filter-line (icon color)
			{ 21, 0xF1D3 },		// t-box-line (design view)
			{ 22, 0xECB5 },		// eye-line (preview)
			{ 23, 0xF064 },		// refresh-line (refresh preview)
		};
		BOOL bGlyphDrawn = FALSE;
		for( int g = 0; g < (int)_countof( c_aIconGlyphs ); g++ ){
			if( c_aIconGlyphs[g].iIcon != iIcon ) continue;
			bGlyphDrawn = DrawIconGlyph( hdc, cx, c_aIconGlyphs[g].wch, crFg, cxRect );
			break;
		}
		
		// the [H][M] mode switch: Remix html5-fill / markdown-fill glyphs
		if( iIcon >= MD_ICON_MODE_H ){
			DrawIconGlyph( hdc, cx, iIcon == MD_ICON_MODE_H ? 0xEE40 : 0xEF1D, crFg, cxRect );
			return;
		}
		// no fallback artwork by design: the subset ships inside this DLL
		SelectObject( hdc, hbrOld );
		SelectObject( hdc, hpenOld );
		DeleteObject( hpen );
	}

	void DrawHtmlIcon( HDC hdc, int cx, int iIcon, COLORREF crFg, int cxRect = 0 )
	{
		// Preserve all 48 persisted HTML icon slots, including customization-only icons.
				static const WCHAR glyphs[] = {
			0xEE03, 0xEFC8, 0xF200, 0xEAD1, 0xEE6B, 0xF244, // heading, paragraph, break, bold, italic, underline
			0xED8C, 0xEFC5, 0xEE4B, 0xEEB8, 0xF1DE, 0xF1AF, // font, color, image, links, table, rule
			0xEAEB, 0xEA27, 0xEA25, 0xEA28, 0xEA26, 0xEEBB, // comment/tags, alignment, ordered list
			0xEEBE, 0xEE54, 0xEE55, 0xEF1C, 0xEFC2, 0xECEF, // list, unindent, indent, highlight, fill, forms
			0xF0EE, 0xECED, 0xEE5E, 0xEED0, 0xECDB, 0xEB85, // settings, form, text, password, textarea, checkbox
			0xF050, 0xEA7A, 0xF327, 0xF39A, 0xEC0A, 0xEAE9, // radio, group box, select, listbox, buttons
			0xECB7, 0xF2F5, 0xEB31, 0xEC36, 0xF0BB, 0xF029, // hidden, object, camera, disc, scanner, printer
			0xED9E, 0xEB97, 0xEA21, 0xEE59, 0xED3B, 0xEF83, // function, error, warning, info, flag, sound
			0xF42E, 0xECB5,                                 // color-filter-line (icon color), eye-line (preview)
			0xEEB8                                          // links-line (link)
		};
		if( iIcon < 0 || iIcon >= (int)_countof( glyphs ) ) return;
		DrawIconGlyph( hdc, cx, glyphs[iIcon], crFg, cxRect );
	}

	COLORREF GetBarGlyphColor()
	{
		// user-picked color wins over everything; readable-on-hover is
		// guaranteed separately by the dark hot/pressed copies, but the
		// contrast against the band background is the user's choice
		if( m_bCustomIconColor ){
			return m_crCustomIcon;
		}
		// Very Dark mode paints the whole bar area black (officially supported
		// via the v20.5 SDK), so the signal comes straight from the theme —
		// more authoritative than measuring colors
		if( IsVeryDark() ){
			return GLYPH_COLOR_LIGHT;
		}
		// Pick a glyph color that contrasts with the bar area's real background.
		// EmEditor's reported bar text color is designed for dark bars, but its
		// dark themes may leave the bar background light, so measuring the
		// background and flipping the glyph color is the only reliable way.
		COLORREF crBack = GetBarBackColor();
		int nLum = ( 299 * GetRValue( crBack ) + 587 * GetGValue( crBack ) + 114 * GetBValue( crBack ) ) / 1000;
		if( nLum >= 128 ){
			return GLYPH_COLOR_DARK;   // light background -> dark glyphs
		}
		return GLYPH_COLOR_LIGHT;      // dark background -> light glyphs
	}

	COLORREF GetBarBackColor()
	{
		COLORREF crBack = CLR_INVALID;
		Editor_Info( m_hWnd, EI_GET_BAR_BACK_COLOR, (LPARAM)&crBack );
		if( crBack == CLR_INVALID ){
			crBack = RGB( 255, 255, 255 );  // unknown: assume light, as dark themes currently leave the bars light
		}
		return crBack;
	}

	BOOL IsVeryDark()
	{
		return Editor_Info( m_hWnd, EI_IS_VERY_DARK, 0 ) == TRUE;
	}

	void AddModeSwitchIcons( HIMAGELIST himl, int cx, COLORREF crFg )
	{
		// appends the [H][M] mode-switch glyphs to whichever image list is active
		for( int i = 0; i < 2; i++ ){
			void* pvBits = NULL;
			HBITMAP hbm = CreateMdIconBitmap( cx, cx, &pvBits );
			if( !hbm ){
				break;
			}
			HDC hdc = CreateCompatibleDC( NULL );
			HBITMAP hbmOld = (HBITMAP)SelectObject( hdc, hbm );
			DrawMdIcon( hdc, cx, MD_ICON_MODE_H + i, crFg, cx );
			SelectObject( hdc, hbmOld );
			DeleteDC( hdc );
			MdKeyOutBackground( cx, cx, pvBits );
			ImageList_Add( himl, hbm, NULL );
			DeleteObject( hbm );
		}
	}

	// Every image is one square cell; the dropdown arrow is not baked into
	// the bitmaps any more — it is drawn live at paint time, anchored to the
	// button's actual rect (see DrawDropdownArrow).
	HIMAGELIST BuildToolbarImageList( int cx, COLORREF crFg, int mode, int nCopies = 1 )
	{
		int count = mode == MODE_MD ? 24 : 51;
		HIMAGELIST himl = ImageList_Create( cx, cx, ILC_COLOR32, ( count + 2 ) * nCopies, 2 );
		if( !himl ){
			return NULL;
		}
		// Each copy repeats every command image plus the two [H][M] glyphs.
		// The first copy uses the bar's foreground; any further copies are
		// drawn dark, giving pressed dropdown buttons a readable glyph on
		// the light pressed fill (pressed drawing always uses this list).
		for( int c = 0; c < nCopies; c++ ){
			COLORREF crCopyFg = c ? GLYPH_COLOR_DARK : crFg;
			for( int i = 0; i < count; i++ ){
				void* pvBits = NULL;
				HBITMAP hbm = CreateMdIconBitmap( cx, cx, &pvBits );
				if( !hbm ){
					break;
				}
				HDC hdc = CreateCompatibleDC( NULL );
				HBITMAP hbmOld = (HBITMAP)SelectObject( hdc, hbm );
				if( mode == MODE_MD ) DrawMdIcon( hdc, cx, i, crCopyFg, cx );
				else DrawHtmlIcon( hdc, cx, i, crCopyFg, cx );
				SelectObject( hdc, hbmOld );
				DeleteDC( hdc );
				MdKeyOutBackground( cx, cx, pvBits );
				ImageList_Add( himl, hbm, NULL );
				DeleteObject( hbm );
			}
			AddModeSwitchIcons( himl, cx, crCopyFg );
		}
		return himl;
	}

	void DisplayBar( bool bVisible )
	{
		if( m_hwndToolbar ){
			_ASSERT( m_nClientID );
			Editor_ToolbarShow( m_hWnd, m_nClientID, bVisible );
			m_bVisible = bVisible;
		}
		else {
			CheckToolbarSize();
			m_bVisible = false;
			//TCHAR sz[260];
			//TCHAR szAppName[80];
			//LoadString( EEGetLocaleInstanceHandle(), IDS_MENU_TEXT, szAppName, _countof( szAppName ) );
			//if( Editor_GetVersion( m_hWnd ) < 8000 ){
			//	LoadString( EEGetLocaleInstanceHandle(), IDS_INVALID_VERSION, sz, _countof( sz ) );
			//	MessageBox( m_hWnd, sz, szAppName, MB_OK | MB_ICONSTOP );
			//	return;
			//}

			HWND hDlg = CreateDialog( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE( IDD_DIALOGBAR ), m_hWnd, NewProc );
			_ASSERT( hDlg );
			if( !hDlg ){
				return;
			}
			m_hDlg = hDlg;

			int nDPI = (int)Editor_DocInfo( m_hWnd, 0, EI_GET_DPI, 0 );
			int cxButtonSize = MulDiv( m_bLargeToolbar ? 24 : 16, nDPI, DEFAULT_DPI );
			// Word-style split layout: the glyph keeps its full cell on the
			// left, dropdown buttons get a dedicated arrow strip on the right
			// so the marker never overlaps the glyph's ink
			const int cxStrip = MulDiv( MD_MARKER_STRIP, nDPI, DEFAULT_DPI );
			const int cxImage = cxButtonSize + cxStrip;

			//int cx = g_metrics.ScaleY( m_bLargeToolbar ? BUTTON_SIZE_LARGE : BUTTON_SIZE_SMALL );
			DWORD dwStyle = TBSTYLE_TOOLTIPS | TBSTYLE_TRANSPARENT | WS_CHILD | WS_CLIPCHILDREN | WS_CLIPSIBLINGS | CCS_NODIVIDER | CCS_NORESIZE | WS_VISIBLE | TBSTYLE_FLAT | CCS_NOPARENTALIGN | CCS_NOMOVEY;
			// No TBSTYLE_EX_DRAWDDARROWS: the control-drawn dropdown arrow's
			// color is fixed by the theme and cannot follow the band, so
			// dropdown buttons get no system arrow; the arrow is drawn live
			// at paint time (see DrawDropdownArrow / NM_CUSTOMDRAW).
			DWORD dwExStyle = TBSTYLE_EX_HIDECLIPPEDBUTTONS;
			HWND hwndToolbar = CreateWindowEx( 0, TOOLBARCLASSNAME, NULL, dwStyle,
				0, 0, 0, cxButtonSize, m_hDlg, (HMENU)(INT_PTR)100, NULL, NULL );
			m_hwndToolbar = hwndToolbar;
			// subclass for the hover-to-open dropdown logic (mouse-move/leave
			// tracking and holding the hot look while a menu tracks)
			SetWindowLongPtr( hwndToolbar, GWLP_USERDATA, (LONG_PTR)this );
			m_wpOldToolbarProc = (WNDPROC)SetWindowLongPtr( hwndToolbar, GWLP_WNDPROC, (LONG_PTR)ToolbarProc );
			SendMessage( hwndToolbar, TB_BUTTONSTRUCTSIZE, (WPARAM) sizeof(TBBUTTON), 0 );
			SendMessage( hwndToolbar, TB_SETBUTTONSIZE, 0, MAKELPARAM( cxButtonSize, 0 ) );
			SendMessage( hwndToolbar, TB_SETEXTENDEDSTYLE, 0, dwExStyle );
			_ASSERT( m_himageToolbar == NULL );

			// the command array must be loaded before the image lists: the
			// Customize dialog seeds its icon picker from the lists
			if( !LoadCmdArray( m_iMode ) ){
				ResetCmdArray( m_iMode );
			}

			COLORREF crGlyphFg = GetBarGlyphColor();
			m_crGlyphFg = crGlyphFg;
			// On a dark band (light glyphs) request a second, dark-drawn copy
			// of every image appended to this list; pressed dropdown buttons
			// are pointed at their dark copy while their menu tracks. A
			// custom icon color always gets the dark copies too, since the
			// light hover/pressed fill must stay readable.
			const int nCopies = ( crGlyphFg == GLYPH_COLOR_LIGHT || m_bCustomIconColor ) ? 2 : 1;
			m_cxImage = cxImage;	// dropdown button target width (cell + arrow strip)
			m_himageToolbar = BuildToolbarImageList( cxButtonSize, crGlyphFg, m_iMode, nCopies );
			if( !m_himageToolbar ){
				DestroyWindow( m_hDlg );
				m_hDlg = NULL;
				m_hwndToolbar = NULL;
				return;
			}
			_ASSERT( m_himageToolbar );
			m_nLightIcons = ImageList_GetImageCount( m_himageToolbar ) / nCopies;
			SendMessage( hwndToolbar, TB_SETIMAGELIST, 0, (LPARAM)m_himageToolbar );

			// on hover the toolbar fills buttons with the light system highlight;
			// when the band is dark (light glyphs) supply a hot image list with
			// dark glyphs so hovered buttons stay readable
			if( nCopies == 2 ){
				m_himageToolbarHot = BuildToolbarImageList( cxButtonSize, GLYPH_COLOR_DARK, m_iMode );
				SendMessage( hwndToolbar, TB_SETHOTIMAGELIST, 0, (LPARAM)m_himageToolbarHot );
			}

			AddButtons( hwndToolbar );
			ApplyToggleStates();
			// CCS_NORESIZE prevents TB_AUTOSIZE from resizing the window, so size it explicitly;
			// EmEditor measures the client at ToolbarOpen time and a 0-width window yields a title-only band
			SIZE size = { 0, 0 };
			SendMessage( hwndToolbar, TB_GETMAXSIZE, 0, (LPARAM)&size );
			if( size.cx > 0 ){
				MoveWindow( hwndToolbar, 0, 0, size.cx, size.cy, TRUE );
			}

			if( hwndToolbar ){
				// The band title doubles as the toolbar's name in View > Toolbars;
				// it is the constant brand name since the [H][M] switch shows the mode.
				TCHAR szTitle[80];
				LoadString( EEGetLocaleInstanceHandle(), IDS_TITLE, szTitle, _countof( szTitle ) );
				RECT rcClient = { 0 };
				GetClientRect( hwndToolbar, &rcClient );
				TOOLBAR_INFO cri;
				ZeroMemory( &cri, sizeof( cri ) );
				cri.cbSize = sizeof( cri );
				cri.nMask = TIM_CLIENT | TIM_TITLE | TIM_FLAGS | TIM_STYLE | TIM_MINCHILD | TIM_CXIDEAL | TIM_BAND | TIM_PLUG_IN_CMD_ID;
				cri.wPlugInCmdID = EEGetCmdID();
				cri.pszTitle = szTitle;
				cri.hwndClient = hwndToolbar;
				cri.cxMinChild = 0;
				cri.cyMinChild = rcClient.bottom - rcClient.top;
				cri.cxIdeal = rcClient.right - rcClient.left;
				cri.cx = rcClient.right - rcClient.left;
				if( bVisible ){
					m_fStyle &= ~RBBS_HIDDEN;
				}
				else {
					m_fStyle |= RBBS_HIDDEN;
				}
				cri.fStyle = m_fStyle;
				cri.nBand = m_nBand;

				m_nClientID = Editor_ToolbarOpen( m_hWnd, &cri );

			if( !m_nClientID ){
				CustomBarClosed();
			}
			else {
				m_bVisible = bVisible;
			}

			ShowWindow( hwndToolbar, m_bVisible );
			// the one-shot startup restore; pane open/close sync is
			// push-driven (EVENT_CUSTOM_BAR_CLOSED)
			SetTimer( m_hDlg, IDT_STARTUP_RESTORE, 800, NULL );
		}
	}
	}

	// re-render the image list against the current command array; used after
	// the Customize dialog closes, which edits buttons live but never
	// rebuilds the lists
	void RebuildToolbarImages()
	{
		if( !m_hwndToolbar || !m_himageToolbar ){
			return;
		}
		int nDPI = (int)Editor_DocInfo( m_hWnd, 0, EI_GET_DPI, 0 );
		int cxButtonSize = MulDiv( m_bLargeToolbar ? 24 : 16, nDPI, DEFAULT_DPI );
		const int cxStrip = MulDiv( MD_MARKER_STRIP, nDPI, DEFAULT_DPI );
		int cxImage = cxButtonSize + cxStrip;
		COLORREF crGlyphFg = GetBarGlyphColor();
		m_crGlyphFg = crGlyphFg;
		const int nCopies = ( crGlyphFg == GLYPH_COLOR_LIGHT || m_bCustomIconColor ) ? 2 : 1;
		HIMAGELIST himlNew = BuildToolbarImageList( cxButtonSize, crGlyphFg, m_iMode, nCopies );
		if( !himlNew ){
			return;
		}
		m_cxImage = cxImage;
		SendMessage( m_hwndToolbar, TB_SETIMAGELIST, 0, (LPARAM)himlNew );
		ImageList_Destroy( m_himageToolbar );
		m_himageToolbar = himlNew;
		m_nLightIcons = ImageList_GetImageCount( m_himageToolbar ) / nCopies;
		if( nCopies == 2 ){
			HIMAGELIST himlHot = BuildToolbarImageList( cxButtonSize, GLYPH_COLOR_DARK, m_iMode );
			if( himlHot ){
				SendMessage( m_hwndToolbar, TB_SETHOTIMAGELIST, 0, (LPARAM)himlHot );
				if( m_himageToolbarHot ){
					ImageList_Destroy( m_himageToolbarHot );
				}
				m_himageToolbarHot = himlHot;
			}
		}
		else if( m_himageToolbarHot ){
			SendMessage( m_hwndToolbar, TB_SETHOTIMAGELIST, 0, (LPARAM)NULL );
			ImageList_Destroy( m_himageToolbarHot );
			m_himageToolbarHot = NULL;
		}
		// swapping the image lists does not repaint the visible buttons:
		// force a full layout + repaint so the new colors show immediately
		SendMessage( m_hwndToolbar, TB_AUTOSIZE, 0, 0 );
		InvalidateRect( m_hwndToolbar, NULL, TRUE );
		UpdateWindow( m_hwndToolbar );
	}

	// On hover/pressed the light highlight fill needs dark ink: the control
	// paints the normal image, this overdraws the dark copy on top (same
	// glyph, different ink). The state comes from the control itself, so it
	// is always in sync regardless of paint timing.
	void DrawButtonStateImage( HDC hdc, const RECT& rc, UINT uIDCommand )
	{
		if( !m_hwndToolbar || !m_himageToolbar )  return;
		// The two check-toggle buttons (Design View / Preview) render their
		// on state natively via TBSTATE_CHECKED + BTNS_CHECK — same as the
		// [H][M] buttons — so this dark-ink overdraw only serves transient
		// pressed/hot states of the plain buttons.
		bool bInverted = ( SendMessage( m_hwndToolbar, TB_GETSTATE, uIDCommand, 0 ) & TBSTATE_PRESSED ) != 0;
		if( !bInverted ){
			int iHot = (int)SendMessage( m_hwndToolbar, TB_GETHOTITEM, 0, 0 );
			if( iHot >= 0 ){
				bInverted = ( iHot == (int)SendMessage( m_hwndToolbar, TB_COMMANDTOINDEX, uIDCommand, 0 ) );
			}
		}
		if( !bInverted )  return;
		// The Design View / Preview toggles render their on state natively
		// (TBSTATE_CHECKED + BTNS_CHECK | BTNS_GROUP, same as the [H][M]
		// buttons): no dark overdraw for them, the control draws the checked
		// fill and the normal image itself
		if( uIDCommand >= ID_COMMAND_BASE && uIDCommand < ID_COMMAND_BASE + (int)Cmds().size() ){
			const int iCmd = Cmds()[ uIDCommand - ID_COMMAND_BASE ].m_iCmd;
			if( iCmd == CMD_MD_VIEW || iCmd == CMD_PREVIEW ){
				return;
			}
		}
		int iIcon = -1;
		if( uIDCommand == ID_MODE_HTML )  iIcon = m_nLightIcons - 2;
		else if( uIDCommand == ID_MODE_MD )  iIcon = m_nLightIcons - 1;
		else if( uIDCommand >= ID_COMMAND_BASE && uIDCommand < ID_COMMAND_BASE + (int)Cmds().size() ){
			iIcon = Cmds()[ uIDCommand - ID_COMMAND_BASE ].m_iIcon;
		}
		if( iIcon < 0 )  return;
		int iDark = m_nLightIcons + iIcon;
		if( iDark >= ImageList_GetImageCount( m_himageToolbar ) )  return;
		int ilcx = 0, ilcy = 0;
		if( !ImageList_GetIconSize( m_himageToolbar, &ilcx, &ilcy ) )  return;
		int x = rc.left + ( ( rc.right - rc.left ) - ilcx ) / 2;
		int y = rc.top + ( ( rc.bottom - rc.top ) - ilcy ) / 2;
		ImageList_Draw( m_himageToolbar, iDark, hdc, x, y, ILD_NORMAL );
	}

	// Design View / Preview are toggles: their on state is carried by the
	// native TBSTATE_CHECKED bit, which the control renders exactly like
	// the [H][M] buttons' checked look — no manual painting needed
	void ApplyToggleStates()
	{
		if( !m_hwndToolbar ){
			return;
		}
		for( int i = 0; i < (int)Cmds().size(); i++ ){
			const int iCmd = Cmds()[ i ].m_iCmd;
			if( iCmd != CMD_MD_VIEW && iCmd != CMD_PREVIEW ){
				continue;
			}
			const UINT uID = (UINT)( i + ID_COMMAND_BASE );
			const bool bOn = ( iCmd == CMD_MD_VIEW ) ? m_bDesignViewOn : m_bPreviewOn;
			LRESULT st = SendMessage( m_hwndToolbar, TB_GETSTATE, uID, 0 );
			LRESULT ns = ( st | TBSTATE_ENABLED ) & ~TBSTATE_PRESSED;
			if( bOn ){
				ns |= TBSTATE_CHECKED;
			}
			else {
				ns &= ~TBSTATE_CHECKED;
			}
			if( ns != st ){
				SendMessage( m_hwndToolbar, TB_SETSTATE, uID, MAKELPARAM( ns, 0 ) );
			}
		}
	}

	// ================= RichBar live preview (our own WebView2) =================

	// The official WebPreview pane shows the SAVED file (its renderer fetches
	// the disk file, or a pane-open-time temp snapshot for modified buffers),
	// so even its right-click Refresh cannot show unsaved edits - verified by
	// the user. This preview hosts OUR WebView2 in a second custom bar and
	// answers every https://document/* fetch from the CURRENT buffer, so a
	// debounced reload after each edit is a true live sync. Markdown reuses
	// EmEditor own marked.js renderer template; HTML documents are served raw.

	static void UrlAppendEncoded( tstring& s, LPCTSTR psz, bool bKeepSlashColon )
	{
		char utf8[MAX_PATH * 3];
		int n = WideCharToMultiByte( CP_UTF8, 0, psz, -1, utf8, (int)sizeof( utf8 ), NULL, NULL );
		for( int i = 0; i < n - 1; i++ ){
			unsigned char c = (unsigned char)utf8[i];
			if( ( c >= 'A' && c <= 'Z' ) || ( c >= 'a' && c <= 'z' ) || ( c >= '0' && c <= '9' ) ||
				c == '.' || c == '-' || c == '_' || ( bKeepSlashColon && ( c == '/' || c == ':' ) ) ){
				s += (TCHAR)c;
			}
			else {
				TCHAR hex[4];
				StringPrintf( hex, _countof( hex ), _T("%%%02X"), c );
				s += hex;
			}
		}
	}

	// the whole document text, line by line (the SDK has no whole-text API)
	bool GetDocTextAll( tstring& sText )
	{
		UINT_PTR nLines = Editor_GetLines( m_hWnd, FALSE );
		if( nLines == 0 || nLines > 2000000 ){
			return false;
		}
		UINT_PTR cchBuf = 4096;
		LPWSTR pszBuf = (LPWSTR)malloc( cchBuf * sizeof( WCHAR ) );
		if( !pszBuf ){
			return false;
		}
		bool bOK = true;
		for( UINT_PTR y = 0; y < nLines; y++ ){
			GET_LINE_INFO gli;
			ZeroMemory( &gli, sizeof( gli ) );
			gli.yLine = y;
			gli.cch = 0;
			UINT_PTR cchNeed = Editor_GetLineW( m_hWnd, &gli, NULL );
			if( cchNeed == (UINT_PTR)-1 ){ bOK = false; break; }
			if( cchNeed + 1 > cchBuf ){
				cchBuf = cchNeed + 256;
				LPWSTR pszNew = (LPWSTR)realloc( pszBuf, cchBuf * sizeof( WCHAR ) );
				if( !pszNew ){ bOK = false; break; }
				pszBuf = pszNew;
			}
			gli.cch = cchBuf;
			UINT_PTR cch = Editor_GetLineW( m_hWnd, &gli, pszBuf );
			if( cch == (UINT_PTR)-1 ){ bOK = false; break; }
			if( cch > cchNeed )  cch = cchNeed;
			sText.append( pszBuf, cch );
			if( y + 1 < nLines ){
				sText += _T("\r\n");
			}
		}
		free( pszBuf );
		return bOK;
	}

	void ServeBufferResponse( ICoreWebView2WebResourceRequestedEventArgs* pArgs )
	{
		ICoreWebView2WebResourceResponse* pResp = NULL;
		tstring sText;
		LPWSTR pszUri = NULL;
		ICoreWebView2WebResourceRequest* pReq = NULL;
		if( SUCCEEDED( pArgs->get_Request( &pReq ) ) && pReq ){
			pReq->get_Uri( &pszUri );
			pReq->Release();
		}
		RbLogF( "fetch: %S", pszUri ? pszUri : L"(null)" );
		CoTaskMemFree( pszUri );
		if( m_pWV2Env && GetDocTextAll( sText ) ){
			int cb = WideCharToMultiByte( CP_UTF8, 0, sText.c_str(), (int)sText.size(), NULL, 0, NULL, NULL );
			HGLOBAL hG = GlobalAlloc( GMEM_MOVEABLE, ( cb > 0 ) ? (SIZE_T)cb : 1 );
			if( hG ){
				void* pv = GlobalLock( hG );
				if( pv ){
					if( cb > 0 ){
						WideCharToMultiByte( CP_UTF8, 0, sText.c_str(), (int)sText.size(), (char*)pv, cb, NULL, NULL );
					}
					GlobalUnlock( hG );
				}
				IStream* pStream = NULL;
				if( SUCCEEDED( CreateStreamOnHGlobal( hG, TRUE, &pStream ) ) ){
					m_pWV2Env->CreateWebResourceResponse( pStream, 200, L"OK",
						L"Content-Type: text/html; charset=utf-8\r\nAccess-Control-Allow-Origin: *", &pResp );
					pStream->Release();	// owns hG on success
				}
				else {
					GlobalFree( hG );
				}
			}
		}
		if( pResp ){
			RbLogF( "serve: %u chars", (unsigned)sText.size() );
			pArgs->put_Response( pResp );
			pResp->Release();
		}
		else {
			RbLogF( "serve FAILED (text=%u)", (unsigned)sText.size() );
		}
	}

	// COM callback: WebResourceRequested - every https://document/* fetch
	// lands here and is answered from the live buffer
	class CWV2ResReqHandler : public ICoreWebView2WebResourceRequestedEventHandler
	{
	public:
		CWV2ResReqHandler( CMyFrame* p ) : m_pFrame( p ), m_cRef( 1 ) {}
		STDMETHODIMP QueryInterface( REFIID riid, void** ppvObject ) override
		{
			if( riid == __uuidof( IUnknown ) || riid == __uuidof( ICoreWebView2WebResourceRequestedEventHandler ) ){
				*ppvObject = static_cast< ICoreWebView2WebResourceRequestedEventHandler* >( this );
				AddRef();
				return S_OK;
			}
			*ppvObject = NULL;
			return E_NOINTERFACE;
		}
		STDMETHODIMP_(ULONG) AddRef() override { return InterlockedIncrement( &m_cRef ); }
		STDMETHODIMP_(ULONG) Release() override
		{
			ULONG c = InterlockedDecrement( &m_cRef );
			if( c == 0 ){ delete this; }
			return c;
		}
		STDMETHODIMP Invoke( ICoreWebView2*, ICoreWebView2WebResourceRequestedEventArgs* pArgs ) override
		{
			m_pFrame->ServeBufferResponse( pArgs );
			return S_OK;
		}
	private:
		~CWV2ResReqHandler() {}
		CMyFrame* m_pFrame;
		LONG m_cRef;
	};

	// COM callback: environment creation completed
	class CWV2EnvHandler : public ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler
	{
	public:
		CWV2EnvHandler( CMyFrame* p ) : m_pFrame( p ), m_cRef( 1 ) {}
		STDMETHODIMP QueryInterface( REFIID riid, void** ppvObject ) override
		{
			if( riid == __uuidof( IUnknown ) || riid == __uuidof( ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler ) ){
				*ppvObject = static_cast< ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler* >( this );
				AddRef();
				return S_OK;
			}
			*ppvObject = NULL;
			return E_NOINTERFACE;
		}
		STDMETHODIMP_(ULONG) AddRef() override { return InterlockedIncrement( &m_cRef ); }
		STDMETHODIMP_(ULONG) Release() override
		{
			ULONG c = InterlockedDecrement( &m_cRef );
			if( c == 0 ){ delete this; }
			return c;
		}
		STDMETHODIMP Invoke( HRESULT errorCode, ICoreWebView2Environment* pEnv ) override
		{
			m_pFrame->OnWV2EnvCreated( errorCode, pEnv );
			return S_OK;
		}
	private:
		~CWV2EnvHandler() {}
		CMyFrame* m_pFrame;
		LONG m_cRef;
	};

	// COM callback: controller creation completed
	class CWV2CtrlHandler : public ICoreWebView2CreateCoreWebView2ControllerCompletedHandler
	{
	public:
		CWV2CtrlHandler( CMyFrame* p ) : m_pFrame( p ), m_cRef( 1 ) {}
		STDMETHODIMP QueryInterface( REFIID riid, void** ppvObject ) override
		{
			if( riid == __uuidof( IUnknown ) || riid == __uuidof( ICoreWebView2CreateCoreWebView2ControllerCompletedHandler ) ){
				*ppvObject = static_cast< ICoreWebView2CreateCoreWebView2ControllerCompletedHandler* >( this );
				AddRef();
				return S_OK;
			}
			*ppvObject = NULL;
			return E_NOINTERFACE;
		}
		STDMETHODIMP_(ULONG) AddRef() override { return InterlockedIncrement( &m_cRef ); }
		STDMETHODIMP_(ULONG) Release() override
		{
			ULONG c = InterlockedDecrement( &m_cRef );
			if( c == 0 ){ delete this; }
			return c;
		}
		STDMETHODIMP Invoke( HRESULT errorCode, ICoreWebView2Controller* pCtrl ) override
		{
			m_pFrame->OnWV2ControllerCreated( errorCode, pCtrl );
			return S_OK;
		}
	private:
		~CWV2CtrlHandler() {}
		CMyFrame* m_pFrame;
		LONG m_cRef;
	};

	static LRESULT CALLBACK PreviewHostProc( HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam )
	{
		if( uMsg == WM_DESTROY ){
			// destroyed by a parent teardown (e.g. the helper dialog dies on a
			// mode switch): drop the stale pointer only — PreviewBarGone is
			// NOT safe to run from inside WM_DESTROY. The INNER window is the
			// controller parent: detach while its window tree still exists
			CMyFrame* pFrame = static_cast< CMyFrame* >( GetFrame( hwnd ) );
			if( pFrame ){
				if( pFrame->m_hwndWebViewHost == hwnd ){
					pFrame->DetachWebView();
					pFrame->m_hwndWebViewHost = NULL;
				}
				if( pFrame->m_hwndPreviewHost == hwnd ){
					pFrame->m_hwndPreviewHost = NULL;
				}
			}
		}
		if( uMsg == WM_SIZE && wParam != SIZE_MINIMIZED ){
			CMyFrame* pFrame = static_cast< CMyFrame* >( GetFrame( hwnd ) );
			if( pFrame ){
				pFrame->OnPreviewHostSize();
			}
		}
		if( uMsg == WM_ERASEBKGND ){
			return DefWindowProc( hwnd, uMsg, wParam, lParam );	// brush fills; web covers when live
		}
		return DefWindowProc( hwnd, uMsg, wParam, lParam );
	}

	bool RegisterPreviewHostClass()
	{
		static bool bRegistered = false;
		if( bRegistered ){
			return true;
		}
		WNDCLASS wc;
		ZeroMemory( &wc, sizeof( wc ) );
		wc.lpfnWndProc = PreviewHostProc;
		wc.hInstance = EEGetInstanceHandle();
		wc.hCursor = LoadCursor( NULL, IDC_ARROW );
		wc.hbrBackground = (HBRUSH)( COLOR_WINDOW + 1 );	// never uninitialized black
		wc.lpszClassName = WV2_PREVIEW_HOST_CLASS;
		bRegistered = RegisterClass( &wc ) != 0;
		return bRegistered;
	}

	static HMODULE LoadWV2Loader()
	{
		HMODULE hMod = GetModuleHandle( _T("WebView2Loader.dll") );
		if( hMod ){
			return hMod;
		}
		TCHAR szPath[MAX_PATH];
		for( int i = 0; i < 2 && !hMod; i++ ){
			DWORD cch = GetModuleFileName( ( i == 0 ) ? EEGetInstanceHandle() : NULL, szPath, MAX_PATH );
			if( cch == 0 || cch >= MAX_PATH ){
				break;
			}
			LPTSTR p = szPath + cch;
			while( p > szPath && p[-1] != _T('\\') )  p--;
			*p = 0;
			lstrcat( szPath, _T("WebView2Loader.dll") );	// beside this DLL, then beside EmEditor.exe
			hMod = LoadLibrary( szPath );
		}
		return hMod;
	}

	void FallbackOfficialPreview()
	{
		// WebView2 unavailable: at least give the user the official (stale)
		// pane instead of a dead button
		RbLogF( "wv2 unavailable -> fallback EEID_MARKDOWN_PREVIEW" );
		PostMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_MARKDOWN_PREVIEW, 0 ), 0 );
	}

	void OnPreviewHostSize()
	{
		if( m_pWV2Controller && m_hwndPreviewHost && IsWindow( m_hwndPreviewHost ) ){
			RECT rc;
			GetClientRect( m_hwndPreviewHost, &rc );
			const double scale = (double)GetDpiForWindow( m_hwndPreviewHost ) / 96.0;
			RECT rcDip;
			rcDip.left   = (LONG)( rc.left   / scale );
			rcDip.top    = (LONG)( rc.top    / scale );
			rcDip.right  = (LONG)( rc.right  / scale );
			rcDip.bottom = (LONG)( rc.bottom / scale );
			m_pWV2Controller->put_Bounds( rcDip );
		}
	}

	void BuildPreviewUrl( tstring& sUrl )
	{
		TCHAR szFile[MAX_PATH] = { 0 };
		Editor_Info( m_hWnd, EI_GET_FILE_NAMEW, (LPARAM)szFile );
		TCHAR szName[MAX_PATH], szFolder[MAX_PATH];
		if( szFile[0] ){
			StringCopy( szFolder, _countof( szFolder ), szFile );
			LPTSTR pszSlash = NULL;
			for( LPTSTR p = szFolder; *p; p++ ){
				if( *p == _T('\\') || *p == _T('/') ){
					pszSlash = p;
				}
			}
			if( pszSlash ){
				// a real path: split into folder + name
				StringCopy( szName, _countof( szName ), pszSlash + 1 );
				*pszSlash = 0;
			}
			else {
				// a title-only name (untitled documents): no folder on disk —
				// resolve images against %TEMP% instead of garbage
				StringCopy( szName, _countof( szName ), szFile );
				GetTempPath( MAX_PATH, szFolder );
				int nLen = lstrlen( szFolder );
				if( nLen > 0 && szFolder[nLen - 1] == _T('\\') ){
					szFolder[nLen - 1] = 0;
				}
			}
		}
		else {
			// untitled: a virtual name under %TEMP% (the renderer only uses the
			// folder to resolve image/link URLs)
			GetTempPath( MAX_PATH, szFolder );
			int nLen = lstrlen( szFolder );
			if( nLen > 0 && szFolder[nLen - 1] == _T('\\') ){
				szFolder[nLen - 1] = 0;
			}
			StringCopy( szName, _countof( szName ), _T("untitled.html") );
		}
		if( m_iMode == MODE_MD ){
			// EmEditor own renderer (marked.js): it refetches the document from
			// https://document/<name>, which our handler serves from the buffer
			TCHAR szRenderer[MAX_PATH];
			DWORD cch = GetModuleFileName( NULL, szRenderer, MAX_PATH );
			if( cch == 0 || cch >= MAX_PATH ){
				return;
			}
			LPTSTR p = szRenderer + cch;
			while( p > szRenderer && p[-1] != _T('\\') )  p--;
			*p = 0;
			StringCat( szRenderer, MAX_PATH, _T("PlugIns\\markdown-renderer.html") );
			for( p = szRenderer; *p; p++ ){
				if( *p == _T('\\') ){
					*p = _T('/');
				}
			}
			sUrl = _T("file:///");
			UrlAppendEncoded( sUrl, szRenderer, true );
			sUrl += _T("?documentName=");
			UrlAppendEncoded( sUrl, szName, false );
			sUrl += _T("&documentFolder=");
			UrlAppendEncoded( sUrl, szFolder, false );
		}
		else {
			// HTML: the browser renders the buffer directly
			sUrl = _T("https://document/");
			UrlAppendEncoded( sUrl, szName, false );
		}
	}

	void NavigateLivePreview()
	{
		if( !m_pWV2 ){
			return;
		}
		tstring sUrl;
		BuildPreviewUrl( sUrl );
		if( !sUrl.empty() ){
			HRESULT hrNav = m_pWV2->Navigate( sUrl.c_str() );
			RbLogF( "preview navigate: %S hr=0x%08X", sUrl.c_str(), (unsigned)hrNav );
		}
	}

	void OnWV2EnvCreated( HRESULT hr, ICoreWebView2Environment* pEnv )
	{
		m_bWV2InitPending = false;
		if( FAILED( hr ) || !pEnv ){
			m_bWV2InitFailed = true;
			RbLogF( "wv2 env FAILED 0x%08X", (unsigned)hr );
			FallbackOfficialPreview();
			return;
		}
		if( !m_hwndPreviewHost ){
			pEnv->Release();	// the bar was closed while initializing
			return;
		}
		m_pWV2Env = pEnv;	// kept for the whole session: reopen is fast
		pEnv->CreateCoreWebView2Controller( m_hwndWebViewHost ? m_hwndWebViewHost : m_hwndPreviewHost, new CWV2CtrlHandler( this ) );
	}

	void OnWV2ControllerCreated( HRESULT hr, ICoreWebView2Controller* pCtrl )
	{
		if( FAILED( hr ) || !pCtrl ){
			m_bWV2InitFailed = true;
			RbLogF( "wv2 controller FAILED 0x%08X", (unsigned)hr );
			FallbackOfficialPreview();
			return;
		}
		if( !m_hwndPreviewHost || !m_hwndWebViewHost || !IsWindow( m_hwndWebViewHost ) ){
			pCtrl->Release();
			return;
		}
		m_pWV2Controller = pCtrl;
		pCtrl->get_CoreWebView2( &m_pWV2 );
		RbLogF( "wv2 controller ready" );
		// the controller is created INVISIBLE by default — without this the
		// pane shows the unbrushed host window (solid black)
		pCtrl->put_IsVisible( TRUE );
		OnPreviewHostSize();
		CWV2ResReqHandler* pHandler = new CWV2ResReqHandler( this );
		HRESULT hrF1 = m_pWV2->AddWebResourceRequestedFilter( L"https://document/*", COREWEBVIEW2_WEB_RESOURCE_CONTEXT_ALL );
		HRESULT hrF2 = m_pWV2->add_WebResourceRequested( pHandler, &m_tWV2ResReq );
		RbLogF( "fetch filter hr=0x%08X handler hr=0x%08X", (unsigned)hrF1, (unsigned)hrF2 );
		pHandler->Release();	// the webview holds its own reference
		NavigateLivePreview();
	}

	void EnsureWebView2()
	{
		if( m_pWV2 || m_bWV2InitFailed || m_bWV2InitPending ){
			return;
		}
		typedef HRESULT (STDAPICALLTYPE *PFN_GetVer)( PCWSTR, LPWSTR* );
		typedef HRESULT (STDAPICALLTYPE *PFN_CreateEnv)( PCWSTR, PCWSTR, ICoreWebView2EnvironmentOptions*, ICoreWebView2CreateCoreWebView2EnvironmentCompletedHandler* );
		HMODULE hLoader = LoadWV2Loader();
		PFN_GetVer pfnGetVer = hLoader ? (PFN_GetVer)GetProcAddress( hLoader, "GetAvailableCoreWebView2BrowserVersionString" ) : NULL;
		PFN_CreateEnv pfnCreate = hLoader ? (PFN_CreateEnv)GetProcAddress( hLoader, "CreateCoreWebView2EnvironmentWithOptions" ) : NULL;
		if( !pfnGetVer || !pfnCreate ){
			m_bWV2InitFailed = true;
			RbLogF( "wv2 loader NOT FOUND" );
			FallbackOfficialPreview();
			return;
		}
		LPWSTR pszVer = NULL;
		if( FAILED( pfnGetVer( NULL, &pszVer ) ) || !pszVer ){
			m_bWV2InitFailed = true;
			RbLogF( "wv2 runtime NOT INSTALLED" );
			FallbackOfficialPreview();
			return;
		}
		CoTaskMemFree( pszVer );
		// SHARE EmEditor's own browser user-data folder: same process + same
		// folder is the supported browser-process-sharing scenario. A private
		// folder never spawned a browser process at all (probed: 0 processes
		// with the controller "ready") — the objects were half-alive, hence
		// no rendering, no fetches and 0xC0000005 teardowns.
		TCHAR szUd[MAX_PATH];
		DWORD cch = GetModuleFileName( NULL, szUd, MAX_PATH );
		if( cch == 0 || cch >= MAX_PATH - 40 ){
			m_bWV2InitFailed = true;
			FallbackOfficialPreview();
			return;
		}
		LPTSTR pszEnd = szUd + cch;
		while( pszEnd > szUd && pszEnd[-1] != _T('\\') )  pszEnd--;
		*pszEnd = 0;
		StringCat( szUd, MAX_PATH, _T("EmEditor.exe.WebView2") );
		m_bWV2InitPending = true;
		RbLogF( "wv2 creating env, udata=%S", szUd );
		HRESULT hrSync = pfnCreate( NULL, szUd, NULL, new CWV2EnvHandler( this ) );
		if( FAILED( hrSync ) ){
			// synchronous failure: the completion handler never fires
			m_bWV2InitPending = false;
			m_bWV2InitFailed = true;
			RbLogF( "wv2 env create SYNC FAILED 0x%08X", (unsigned)hrSync );
			FallbackOfficialPreview();
		}
	}

	bool IsLivePreviewOpen()
	{
		return m_hwndPreviewHost && IsWindow( m_hwndPreviewHost );
	}

	void OpenLivePreview()
	{
		if( !IsLivePreviewOpen() ){
			if( !RegisterPreviewHostClass() ){
				FallbackOfficialPreview();
				return;
			}
			int nDPI = (int)Editor_DocInfo( m_hWnd, 0, EI_GET_DPI, 0 );
			// the bar takes its WIDTH from the client window for a right-docked
			// pane; size the host before opening
			int cxPane = MulDiv( 460, nDPI, DEFAULT_DPI );
			int cyPane = MulDiv( 640, nDPI, DEFAULT_DPI );
			m_hwndPreviewHost = CreateWindowEx( 0, WV2_PREVIEW_HOST_CLASS, NULL,
				WS_CHILD | WS_VISIBLE | WS_CLIPCHILDREN, 0, 0, cxPane, cyPane, m_hDlg, NULL, EEGetInstanceHandle(), NULL );
			if( !m_hwndPreviewHost ){
				FallbackOfficialPreview();
				return;
			}
			SetWindowLongPtr( m_hwndPreviewHost, GWLP_USERDATA, (LONG_PTR)this );
			// the WebView2 controller binds to an INNER child: EmEditor reparents
			// the host when it adopts the bar, and a reparented controller
			// parent taints the controller teardown (the recurring crash) — the
			// inner window keeps the controller parent stable
			m_hwndWebViewHost = CreateWindowEx( 0, WV2_PREVIEW_HOST_CLASS, NULL,
				WS_CHILD | WS_VISIBLE | WS_CLIPCHILDREN, 0, 0, cxPane, cyPane, m_hwndPreviewHost, NULL, EEGetInstanceHandle(), NULL );
			SetWindowLongPtr( m_hwndWebViewHost, GWLP_USERDATA, (LONG_PTR)this );
			CUSTOM_BAR_INFO cbi;
			ZeroMemory( &cbi, sizeof( cbi ) );
			cbi.cbSize = sizeof( cbi );
			cbi.hwndClient = m_hwndPreviewHost;
			cbi.pszTitle = WV2_PREVIEW_BAR_TITLE;
			cbi.iPos = CUSTOM_BAR_RIGHT;
			m_nPreviewBarID = Editor_CustomBarOpen( m_hWnd, &cbi );
			RbLogF( "preview bar open: id=%u bar=%p host=%p", m_nPreviewBarID, cbi.hwndCustomBar, m_hwndPreviewHost );
			if( !m_nPreviewBarID ){
				DestroyWindow( m_hwndPreviewHost );
				m_hwndPreviewHost = NULL;
				FallbackOfficialPreview();
				return;
			}
		}
		if( m_pWV2 ){
			NavigateLivePreview();
		}
		else {
			EnsureWebView2();
		}
	}

	void CloseLivePreview()
	{
		// detach WebView2 FIRST: the core bar teardown then never has to
		// destroy live WebView2 child windows (the 0x400000 crash)
		DetachWebView();
		if( m_nPreviewBarID ){
			BOOL bClosed = Editor_CustomBarClose( m_hWnd, m_nPreviewBarID );
			RbLogF( "custom bar close ret=%d", (int)bClosed );
		}
		// the core does not notify plugin-initiated closes — release directly
		// (idempotent; a later CLOSED event with our id is a no-op)
		PreviewBarGone();
	}

	// the OFFICIAL WebPreview pane (EmEditorWebPreview2) - the Preview button
	// drives it via 23275, and its real visibility is the button truth (the
	// pane can auto-open at startup or be toggled from EmEditor's own UI)
	static BOOL CALLBACK FindOfficialPaneProc( HWND hwnd, LPARAM lParam )
	{
		WCHAR szCls[32];
		if( GetClassNameW( hwnd, szCls, _countof( szCls ) ) == 0 ||
			lstrcmpW( szCls, L"EmEditorWebPreview2" ) != 0 ){
			return TRUE;
		}
		*(HWND*)lParam = hwnd;
		return FALSE;
	}

	// identity of the active document for per-document button state
	tstring CurrentDocKey()
	{
		TCHAR szFile[MAX_PATH] = { 0 };
		Editor_Info( m_hWnd, EI_GET_FILE_NAMEW, (LPARAM)szFile );
		if( szFile[0] ){
			return tstring( szFile );
		}
		return tstring( _T("<untitled>") );	// untitled documents share one slot
	}

	bool IsPreviewDocOn()
	{
		tstring sKey = CurrentDocKey();
		for( size_t i = 0; i < m_vPreviewDocs.size(); i++ ){
			if( m_vPreviewDocs[i] == sKey ){
				return true;
			}
		}
		return false;
	}

	void SetPreviewDocOn( bool bOn )
	{
		tstring sKey = CurrentDocKey();
		for( size_t i = 0; i < m_vPreviewDocs.size(); i++ ){
			if( m_vPreviewDocs[i] == sKey ){
				if( bOn ){
					return;
				}
				m_vPreviewDocs.erase( m_vPreviewDocs.begin() + i );
				return;
			}
		}
		if( bOn ){
			m_vPreviewDocs.push_back( sKey );
		}
	}

	bool IsOfficialPaneVisible()
	{
		HWND hwndPane = NULL;
		EnumChildWindows( m_hWnd, FindOfficialPaneProc, (LPARAM)&hwndPane );
		return hwndPane != NULL;
	}

	void SyncPreviewToPane()
	{
		if( !m_hwndToolbar ){
			return;
		}
		bool bPane = IsOfficialPaneVisible();
		if( bPane != m_bPreviewOn ){
			RbLogF( "pane sync: visible=%d previewOn=%d", (int)bPane, (int)m_bPreviewOn );
			m_bPreviewOn = bPane;
			SaveProfile();
			ApplyToggleStates();
		}
	}

	// release the WebView2 objects. SEH-guarded: a fault inside the WebView2
	// teardown (its controller state can be tainted when EmEditor reparents
	// the host window) must never take EmEditor down
	void DetachWebView()
	{
		__try {
			if( m_pWV2Controller ){
				if( m_hwndWebViewHost && IsWindow( m_hwndWebViewHost ) ){
					m_pWV2Controller->Close();	// documented order: before the parent window dies
				}
				m_pWV2Controller->Release();
				m_pWV2Controller = NULL;
				RbLogF( "wv2 detached (controller)" );
			}
			if( m_pWV2 ){
				m_pWV2->Release();
				m_pWV2 = NULL;
				RbLogF( "wv2 detached (webview)" );
			}
		}
		__except( EXCEPTION_EXECUTE_HANDLER ) {
			RbLogF( "wv2 detach FAULTED 0x%08X (suppressed)", (unsigned)GetExceptionCode() );
			m_pWV2Controller = NULL;
			m_pWV2 = NULL;
		}
	}

	void PreviewBarGone()
	{
		m_nPreviewBarID = 0;
		DetachWebView();
		if( m_hwndPreviewHost ){
			if( IsWindow( m_hwndPreviewHost ) ){
				DestroyWindow( m_hwndPreviewHost );
			}
			m_hwndPreviewHost = NULL;
		}
		if( m_hwndWebViewHost ){
			if( IsWindow( m_hwndWebViewHost ) ){
				DestroyWindow( m_hwndWebViewHost );
			}
			m_hwndWebViewHost = NULL;
		}
		if( m_bPreviewOn ){
			m_bPreviewOn = false;
			SaveProfile();
			ApplyToggleStates();
		}
	}

	void ReloadLivePreview()
	{
		if( m_pWV2 && IsLivePreviewOpen() ){
			m_pWV2->Reload();
		}
	}

	// EVENT_CUSTOM_BAR_CLOSED handler, guarded: a fault here (WebView2
	// teardown racing the core bar destruction) must NOT take EmEditor down
	static void HandleBarClosedGuarded( CMyFrame* pFrame, CUSTOM_BAR_CLOSE_INFO* pCI )
	{
		__try {
			pFrame->RbLogF( "bar closed event: nID=%u iPos=%d flags=0x%X (ours=%u)", pCI->nID, pCI->iPos, pCI->dwFlags, pFrame->m_nPreviewBarID );
			if( pCI->nID == pFrame->m_nPreviewBarID ){
				pFrame->PreviewBarGone();
			}
		}
		__except( EXCEPTION_EXECUTE_HANDLER ) {
			pFrame->RbLogF( "bar closed handler FAULTED 0x%08X (suppressed)", (unsigned)GetExceptionCode() );
			pFrame->m_nPreviewBarID = 0;
			pFrame->m_pWV2Controller = NULL;
			pFrame->m_pWV2 = NULL;
			pFrame->m_hwndPreviewHost = NULL;
			pFrame->m_bPreviewOn = false;
		}
	}


	// one-shot startup restore: reopen the panes that were on when the
	// previous session ended (EmEditor persists neither pane itself —
	// verified by registry runtime diff — so our profile flags are the memory)
	void OnStartupRestore()
	{
		if( !m_hwndToolbar || m_bPanesRestored ){
			return;
		}
		m_bPanesRestored = true;
		if( m_bPreviewOn && !IsOfficialPaneVisible() ){
			RbLogF( "startup restore: preview (mode=%d) -> official 23275", m_iMode );
			PostMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_MARKDOWN_PREVIEW, 0 ), 0 );
		}
		SyncPreviewToPane();	// EmEditor may have restored the pane itself; align the button
		// EmEditor restores the design view itself; query the command status
		// and align the button
		{
			BOOL bChecked = FALSE;
			Editor_QueryStatus( m_hWnd, EEID_MARKDOWN_VIEW, &bChecked );
			m_bDesignViewOn = bChecked != FALSE;
			ApplyToggleStates();
		}
	}



	// deferred markdown-bar correction: EmEditor auto-shows the markdown
	// toolbar when the design view toggles; if the user had it hidden, put
	// it back. The bar's visibility is queried via EE_QUERY_STATUS on its
	// own command (23274) — a state-checked correction, not a blind toggle
	void OnDesignSyncTimer()
	{
		BOOL bChecked = FALSE;
		Editor_QueryStatus( m_hWnd, EEID_SHOW_MARKDOWN_BAR, &bChecked );
		RbLogF( "design sync: markdown bar shown=%d", (int)bChecked );
		if( bChecked ){
			PostMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_SHOW_MARKDOWN_BAR, 0 ), 0 );
		}
	}

			// find the pane's top Chromium window (the reload target)
	static BOOL CALLBACK FindChromeChildProc( HWND hwnd, LPARAM lParam )
	{
		WCHAR szCls[32];
		if( GetClassNameW( hwnd, szCls, _countof( szCls ) ) != 0 &&
			lstrcmpW( szCls, L"Chrome_WidgetWin_1" ) == 0 ){
			*(HWND*)lParam = hwnd;
			return FALSE;
		}
		return TRUE;
	}

	// rewrite the NEWEST %TEMP% EEWxxxx.htm snapshot (the one the pane is
	// showing) with the current buffer text
	void FeedPreviewSnapshot()
	{
		TCHAR szTemp[ MAX_PATH ] = { 0 };
		GetTempPath( MAX_PATH, szTemp );
		TCHAR szMask[ MAX_PATH ];
		wsprintf( szMask, _T("%sEEW*.htm"), szTemp );
		WIN32_FIND_DATA wfd;
		HANDLE hFind = FindFirstFile( szMask, &wfd );
		if( hFind == INVALID_HANDLE_VALUE ){
			RbLogF( "feed: no EEW snapshot found" );
			return;
		}
		FILETIME ftNewest = { 0 };
		TCHAR szNewest[ MAX_PATH ] = { 0 };
		do {
			if( ( wfd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY ) == 0 ){
				if( CompareFileTime( &wfd.ftLastWriteTime, &ftNewest ) > 0 ){
					ftNewest = wfd.ftLastWriteTime;
					wsprintf( szNewest, _T("%s%s"), szTemp, wfd.cFileName );
				}
			}
		} while( FindNextFile( hFind, &wfd ) );
		FindClose( hFind );
		if( szNewest[0] == 0 ){
			return;
		}
		tstring sText;
		if( !GetDocTextAll( sText ) ){
			RbLogF( "feed: buffer read FAILED" );
			return;
		}
		int cb = WideCharToMultiByte( CP_UTF8, 0, sText.c_str(), (int)sText.size(), NULL, 0, NULL, NULL );
		HANDLE hFile = CreateFile( szNewest, GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, 0, NULL );
		if( hFile == INVALID_HANDLE_VALUE ){
			RbLogF( "feed: write FAILED (%s)", szNewest );
			return;
		}
		const BYTE bom[3] = { 0xEF, 0xBB, 0xBF };
		DWORD cbW = 0;
		WriteFile( hFile, bom, 3, &cbW, NULL );
		if( cb > 0 ){
			CHAR* pszUtf8 = (CHAR*)malloc( cb );
			WideCharToMultiByte( CP_UTF8, 0, sText.c_str(), (int)sText.size(), pszUtf8, cb, NULL, NULL );
			WriteFile( hFile, pszUtf8, cb, &cbW, NULL );
			free( pszUtf8 );
		}
		CloseHandle( hFile );
		RbLogF( "feed: %S <- %u chars", szNewest, (unsigned)sText.size() );
	}

	// reload the pane browser IN PLACE (no close, no flicker)
	void ReloadPreviewBrowser( HWND hwndPane )
	{
		HWND hwndChrome = NULL;
		EnumChildWindows( hwndPane, FindChromeChildProc, (LPARAM)&hwndChrome );
		if( !hwndChrome ){
			RbLogF( "reload: chrome window NOT FOUND" );
			return;
		}
		// two channels: the browser app-command and a plain F5 — either lands
		PostMessage( hwndChrome, WM_APPCOMMAND, 0, MAKELPARAM( 0, APPCOMMAND_BROWSER_REFRESH ) );
		PostMessage( hwndChrome, WM_KEYDOWN, VK_F5, 0 );
		PostMessage( hwndChrome, WM_KEYUP, VK_F5, 0 );
		RbLogF( "reload: F5+APPCOMMAND sent" );
	}// The dropdown arrow, drawn live in NM_CUSTOMDRAW's item-post-paint
	// stage: right-anchored inside the button's ACTUAL rect, so the control's
	// image placement and any width rounding cannot shift or clip it. The
	// glyph is the bundled Remix arrow-down-s-fill; on hover/pressed the
	// light fill needs dark ink, mirroring the hot image list.
	void DrawDropdownArrow( HDC hdc, const RECT& rc, UINT uIDCommand )
	{
		const WCHAR wch = 0xEA4D;	// ri-arrow-down-s-fill
		const int nDPI = (int)Editor_DocInfo( m_hWnd, 0, EI_GET_DPI, 0 );
		// uItemState is documented invalid past ITEMPREPAINT, so read the
		// button state from the control instead: pressed or hot means the
		// light highlight fill, which needs dark ink
		bool bInverted = false;
		if( m_hwndToolbar ){
			bInverted = ( SendMessage( m_hwndToolbar, TB_GETSTATE, uIDCommand, 0 ) & TBSTATE_PRESSED ) != 0;
			if( !bInverted ){
				int iHot = (int)SendMessage( m_hwndToolbar, TB_GETHOTITEM, 0, 0 );
				if( iHot >= 0 ){
					bInverted = ( iHot == (int)SendMessage( m_hwndToolbar, TB_COMMANDTOINDEX, uIDCommand, 0 ) );
				}
			}
		}
		COLORREF crFg = bInverted ? GLYPH_COLOR_DARK : m_crGlyphFg;
		const int em = MulDiv( 13, nDPI, DEFAULT_DPI );	// ink ≈ 6.5 logical px wide
		const int nMargin = MulDiv( 1, nDPI, DEFAULT_DPI );
		HFONT hfontIcon = GetMdIconFont( em );
		if( !hfontIcon ) return;
		HFONT old = (HFONT)SelectObject( hdc, hfontIcon );
		if( old && old != (HFONT)HGDI_ERROR ){
			WCHAR face[LF_FACESIZE] = {};
			WORD index = 0xFFFF;
			if( GetTextFaceW( hdc, _countof( face ), face ) && lstrcmpiW( face, L"remixicon" ) == 0 &&
				GetGlyphIndicesW( hdc, &wch, 1, &index, GGI_MARK_NONEXISTING_GLYPHS ) != GDI_ERROR &&
				index != 0 && index != 0xFFFF ){
				GLYPHMETRICS gm = {};
				MAT2 mat = { { 0, 1 }, { 0, 0 }, { 0, 0 }, { 0, 1 } };
				if( GetGlyphOutlineW( hdc, wch, GGO_METRICS, &gm, 0, NULL, &mat ) != GDI_ERROR &&
					gm.gmBlackBoxX > 0 && gm.gmBlackBoxY > 0 ){
					SetBkMode( hdc, TRANSPARENT );
					SetTextColor( hdc, crFg );
					// TextOutW positions by the baseline: right edge of the
					// ink sits nMargin inside the button's right edge, the
					// ink is centered vertically in the button
					SetTextAlign( hdc, TA_LEFT | TA_BASELINE | TA_NOUPDATECP );
					int x = rc.right - nMargin - gm.gmBlackBoxX - gm.gmptGlyphOrigin.x;
					int y = ( rc.top + rc.bottom + 2 * gm.gmptGlyphOrigin.y - gm.gmBlackBoxY ) / 2;
					TextOutW( hdc, x, y, &wch, 1 );
				}
			}
			SelectObject( hdc, old );
		}
		DeleteObject( hfontIcon );
	}

	void OnCommand( HWND hwndView )
	{
		m_hwndView = hwndView;	// the plug-in OnCommand contract passes the VIEW window
		DisplayBar( !IsVisible() );
	}

	void CustomBarClosed()
	{
		if( m_hDlg ){
			KillTimer( m_hDlg, IDT_STARTUP_RESTORE );
		}
		if( m_hwndToolbar ){
			if( IsWindow( m_hwndToolbar ) ){
				DestroyWindow( m_hwndToolbar );
			}
			if( m_himageToolbar ){
				VERIFY( ImageList_Destroy( m_himageToolbar ) );
				m_himageToolbar = NULL;
			}
			if( m_himageToolbarHot ){
				VERIFY( ImageList_Destroy( m_himageToolbarHot ) );
				m_himageToolbarHot = NULL;
			}
			_ASSERT( !IsWindow( m_hwndToolbar ) );
			m_hwndToolbar = NULL;
			m_nClientID = 0;
		}
		if( m_hDlg ){
			DestroyWindow( m_hDlg );
			m_hDlg = NULL;
		}
		if( m_hwndPreviewHost && !IsWindow( m_hwndPreviewHost ) ){
			// the preview host died with its parent dialog (it was never
			// adopted by the core bar window): release the COM side here —
			// NOT from inside WM_DESTROY
			m_hwndPreviewHost = NULL;
			if( m_pWV2Controller ){
				m_pWV2Controller->Release();
				m_pWV2Controller = NULL;
			}
			if( m_pWV2 ){
				m_pWV2->Release();
				m_pWV2 = NULL;
			}
			m_nPreviewBarID = 0;
			m_bPreviewOn = false;
		}
	}

	BOOL QueryStatus( HWND /*hwndView*/, LPBOOL pbChecked )
	{		
		*pbChecked = IsVisible();
		return TRUE;
	}

	void OnEvents( HWND hwndView, UINT nEvent, LPARAM lParam )
	{
		m_hwndView = hwndView;
		if( nEvent & EVENT_CREATE_FRAME ){
			LoadProfile();
			TCHAR szConfigName[ MAX_CONFIG_NAME ] = { 0 };
			Editor_GetConfigW( m_hWnd, szConfigName );
			StringCopy( m_szOldConfig, _countof( m_szOldConfig ), szConfigName );
			m_iMode = DetectMode();

			bool bShow = (!m_bAutoDisplay && m_bOpenStartup) || (m_bAutoDisplay && ConfigExist( szConfigName ) );
			DisplayBar( bShow );
//			DisplayBar( m_bAutoDisplay && ConfigExist( szConfigName ) );
		}
		if( nEvent & EVENT_CLOSE_FRAME ){
			// the frame is tearing down: release our preview COM side locally
			// WITHOUT sending EE_CUSTOM_BAR_CLOSE / EE_TOOLBAR_CLOSE for the
			// preview bar back into the core (re-entering the core here
			// produced the reported nEvent=0x20000 crash); EmEditor destroys
			// the bars itself
			PreviewBarGone();
			if( m_pWV2Env ){
				m_pWV2Env->Release();
				m_pWV2Env = NULL;
			}
			if( m_hwndToolbar ){
				_ASSERTE( m_nClientID );
				Editor_ToolbarClose( m_hWnd, m_nClientID );
				CustomBarClosed();
			}
		}
		if( nEvent & EVENT_TOOLBAR_CLOSED ){
//			m_bOpenStartup = false;
			// this message arrives even if plug-in does not own this custom bar, so make sure it is mine.
			TOOLBAR_INFO* pTI = (TOOLBAR_INFO*)lParam;
			if( (pTI->nMask & TIM_ID) && pTI->nID == m_nClientID ){
				_ASSERT( m_hwndToolbar != NULL );
				CustomBarClosed();
				// if the frame closed while the Toolbar is open, save the status for next startup.
				if( pTI->nMask & TIM_CX ){
					m_cx = pTI->cx;
				}
				if( pTI->nMask & TIM_STYLE ){
					m_fStyle = pTI->fStyle;
				}
				if( pTI->nMask & TIM_BAND ){
					m_nBand = pTI->nBand;
				}
//				m_bOpenStartup = true;
				SaveProfile();
			}
		}
		if( nEvent & EVENT_TOOLBAR_SHOW ){
			TOOLBAR_INFO* pTI = (TOOLBAR_INFO*)lParam;
			if( (pTI->nMask & TIM_ID) && pTI->nID == m_nClientID ){
				_ASSERT( m_hwndToolbar != NULL );
				if( pTI->nMask & TIM_STYLE ){
					m_bVisible = !(pTI->fStyle & RBBS_HIDDEN);
					m_bOpenStartup = m_bVisible;
					WriteProfileInt( _T("OpenStartup"), m_bOpenStartup );
				}
			}
		}
		if( nEvent & (EVENT_CONFIG_CHANGED | EVENT_FILE_OPENED | EVENT_DOC_SEL_CHANGED ) ) {
			// the manual mode override only lasts while the same document state remains;
			// any document or configuration change returns the bar to auto detection
			m_iModeOverride = -1;
			int iNewMode = DetectMode();
			// follow the document, exactly like the official button: query the
			// built-in command's REAL per-document checked state (EE_QUERY_STATUS,
			// the official status query used by EmEditor's own toolbar buttons)
			{
				BOOL bChecked = FALSE;
				Editor_QueryStatus( m_hWnd, EEID_MARKDOWN_VIEW, &bChecked );
				m_bDesignViewOn = bChecked != FALSE;
				ApplyToggleStates();
			}
			{
				bool bWant = IsPreviewDocOn();
				bool bPane = IsOfficialPaneVisible();
				m_bPreviewOn = bWant;
				if( bWant != bPane ){
					RbLogF( "doc switch: preview want=%d pane=%d -> 23275", (int)bWant, (int)bPane );
					PostMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_MARKDOWN_PREVIEW, 0 ), 0 );
				}
			}
			if( m_hwndToolbar ){
				ApplyToggleStates();
			}
			if( iNewMode != m_iMode ){
				m_iMode = iNewMode;
				if( m_hwndToolbar && m_bVisible ){
					// re-create the custom bar so it shows the other mode's button set
					Editor_ToolbarClose( m_hWnd, m_nClientID );
					CustomBarClosed();
					DisplayBar( true );
				}
			}
			if( m_bAutoDisplay ){
				TCHAR szConfigName[ MAX_CONFIG_NAME ] = { 0 };
				Editor_GetConfigW( m_hWnd, szConfigName );
				if( lstrcmpi( szConfigName, m_szOldConfig ) != 0 ){
					if( ConfigExist( szConfigName ) ){
						if( !IsVisible() ){
							DisplayBar( true );
						}
					}
					else {
						if( IsVisible() ){
							DisplayBar( false );
						}
					}
					StringCopy( m_szOldConfig, _countof( m_szOldConfig ), szConfigName );
				}
			}
		}
		if( nEvent & EVENT_UI_CHANGED ){
			if( lParam & (UI_CHANGED_TOOLBARS | UI_CHANGED_DPI) ){
				bool bVisible = IsVisible();
				bool bOld = m_bLargeToolbar;
				CheckToolbarSize();
				if( (lParam & UI_CHANGED_DPI) || bOld != m_bLargeToolbar ){
					Editor_ToolbarClose( m_hWnd, m_nClientID );
					CustomBarClosed();
					DisplayBar( bVisible );
				}
			}
		}
		if( nEvent & ( EVENT_UI_CHANGED | EVENT_CONFIG_CHANGED ) ){
			// re-create the bar when the color environment changed, so the
			// runtime-drawn glyphs follow light/dark scheme switches
			if( m_hwndToolbar && m_bVisible ){
				COLORREF crFg = GetBarGlyphColor();
				if( crFg != m_crGlyphFg ){
					Editor_ToolbarClose( m_hWnd, m_nClientID );
					CustomBarClosed();
					DisplayBar( true );
				}
			}
		}
		if( nEvent & EVENT_CUSTOM_BAR_CLOSED ){
			HandleBarClosedGuarded( this, (CUSTOM_BAR_CLOSE_INFO*)lParam );
			SyncPreviewToPane();	// the official pane may have been closed from its own UI
		}
		if( nEvent & EVENT_CHANGE ){
			// every buffer modification re-arms the debounce; one WebView2
			// reload fires when the typing pauses (see ReloadLivePreview)
			if( m_hDlg ){
				SetTimer( m_hDlg, IDT_PREVIEW_REFRESH, 400, NULL );
			}
		}
	}

	BOOL QueryUninstall( HWND /*hDlg*/ )
	{
		return TRUE;
	}

	BOOL SetUninstall( HWND hDlg, LPTSTR /*pszUninstallCommand*/, LPTSTR /*pszUninstallParam*/ )
	{
		TCHAR sz[80];
		TCHAR szAppName[80];
		LoadString( EEGetLocaleInstanceHandle(), IDS_SURE_TO_UNINSTALL, sz, sizeof( sz ) / sizeof( TCHAR ) );
		LoadString( EEGetLocaleInstanceHandle(), IDS_MENU_TEXT, szAppName, sizeof( szAppName ) / sizeof( TCHAR ) );
		if( MessageBox( hDlg, sz, szAppName, MB_YESNO | MB_ICONEXCLAMATION ) == IDYES ){
			// Delete the registry/INI key.
			EraseProfile();
			m_bUninstalling = true;
			return UNINSTALL_SIMPLE_DELETE;
		}
		return UNINSTALL_FALSE;
	}

	BOOL QueryProperties( HWND /*hDlg*/ )
	{
		return TRUE;
	}

	BOOL SetProperties( HWND hDlg )
	{
		DialogBox( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE( IDD_PROP ), hDlg, PropDlg );
		return TRUE;
	}

	BOOL PreTranslateMessage( HWND /*hwndView*/, MSG* pMsg )
	{
		HWND hwndFocus = GetFocus();
		if( hwndFocus ){
			if( IsVisible() && IsChild( m_hwndToolbar, hwndFocus ) ){
				if( pMsg->message == WM_KEYDOWN ){
					bool bCtrl = GetKeyState( VK_CONTROL ) < 0;
					bool bShift = GetKeyState( VK_SHIFT ) < 0;
					if( !bCtrl ){
						if( pMsg->wParam == VK_ESCAPE ){
							if( !bShift ){
								Editor_ExecCommand( m_hWnd, EEID_ACTIVE_PANE );
								return TRUE;
							}
						}
					}
				}
				if( IsDialogMessage( m_hwndToolbar, pMsg ) ){
					return TRUE;
				}
			}
		}
		return FALSE;
	}

	CMyFrame()
	{
		m_iMode = MODE_HTML;
		m_iModeOverride = -1;
		m_crGlyphFg = 0xFFFFFFFF;
		m_himageToolbarHot = NULL;
		ZERO_INIT_FIRST_MEM( CMyFrame, m_hwndToolbar );
		m_cxImage = 0;		// set on every image-list build
		m_nButtonPad = 0;	// measured on every AddButtons
		m_bCustomIconColor = false;
		m_crCustomIcon = RGB( 224, 224, 224 );
		m_bIconColorDirty = false;
		m_bDesignViewOn = false;
		m_bPreviewOn = false;
		m_bPanesRestored = false;
		m_nPreviewBarID = 0;
		m_hwndPreviewHost = NULL;
		m_pWV2Env = NULL;
		m_pWV2Controller = NULL;
		m_pWV2 = NULL;
		m_bWV2InitFailed = false;
		m_bWV2InitPending = false;
		m_hwndView = NULL;
		m_nBand = (UINT)-1;
	}

	~CMyFrame()
	{
		CloseLivePreview();
		if( m_pWV2Env ){
			m_pWV2Env->Release();
			m_pWV2Env = NULL;
		}
		CustomBarClosed();
	}

	CCmdArray& Cmds()
	{
		return m_CmdArray[m_iMode];
	}

	bool ConfigInList( vector<tstring>& arrConfig, LPCTSTR pszConfig )
	{
		for( vector<tstring>::iterator it = arrConfig.begin(); it != arrConfig.end(); it++ ){
			if( !lstrcmpi( it->c_str(), pszConfig ) ){
				return true;
			}
		}
		return false;
	}

	bool ConfigExist( LPCTSTR pszConfig )
	{
		return ConfigInList( m_AutoConfigArray, pszConfig ) || ConfigInList( m_MdConfigArray, pszConfig );
	}

	int DetectMode()
	{
		if( m_iModeOverride >= 0 ){
			return m_iModeOverride;
		}
		TCHAR szConfigName[ MAX_CONFIG_NAME ] = { 0 };
		Editor_GetConfigW( m_hWnd, szConfigName );
		if( ConfigInList( m_MdConfigArray, szConfigName ) ){
			return MODE_MD;
		}
		if( ConfigInList( m_AutoConfigArray, szConfigName ) ){
			return MODE_HTML;
		}
		TCHAR szPath[ MAX_PATH ] = { 0 };
		Editor_Info( m_hWnd, EI_GET_FILE_NAMEW, (LPARAM)szPath );
		LPCTSTR pszExt = PathFindExtension( PathFindFileName( szPath ) );
		if( pszExt[0] == '.' ){
			if( _tcsicmp( pszExt, _T(".md") ) == 0 || _tcsicmp( pszExt, _T(".markdown") ) == 0 ||
				_tcsicmp( pszExt, _T(".mdown") ) == 0 || _tcsicmp( pszExt, _T(".mkd") ) == 0 ){
				return MODE_MD;
			}
			if( _tcsicmp( pszExt, _T(".htm") ) == 0 || _tcsicmp( pszExt, _T(".html") ) == 0 ||
				_tcsicmp( pszExt, _T(".xhtml") ) == 0 || _tcsicmp( pszExt, _T(".shtml") ) == 0 ){
				return MODE_HTML;
			}
		}
		return m_iMode;
	}

	void OnCustomize( HWND hwnd )
	{
		if( DialogBox( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE( IDD_CUSTOMIZE ), hwnd, CustomizeDlg ) == IDOK ){
		}
		// customization edits buttons live but never rebuilds the image
		// lists; re-sync so the dropdown marker follows any icon/command
		// changes (a removed dropdown command drops its marker, a re-added
		// one gains it immediately instead of at the next bar re-creation)
		RebuildToolbarImages();
	}

	void OnPropInitDialog( HWND hDlg )
	{
		CenterWindow( hDlg );
		VERIFY( CheckDlgButton( hDlg, IDC_AUTO_DISPLAY, m_bAutoDisplay ) );

		// icon color: remember the pair as loaded, so OK can tell whether
		// the bar needs a re-render
		m_bIconColorDirty = false;
		CheckRadioButton( hDlg, IDC_RADIO_ICON_AUTO, IDC_RADIO_ICON_CUSTOM,
			m_bCustomIconColor ? IDC_RADIO_ICON_CUSTOM : IDC_RADIO_ICON_AUTO );
		TCHAR szColor[16];
		StringPrintf( szColor, _countof( szColor ), _T("#%02X%02X%02X"),
			GetRValue( m_crCustomIcon ), GetGValue( m_crCustomIcon ), GetBValue( m_crCustomIcon ) );
		SetDlgItemText( hDlg, IDC_BTN_ICON_COLOR, szColor );

		TCHAR szText[40];
		LoadString( EEGetLocaleInstanceHandle(), IDS_CONFIGS, szText, _countof( szText ) );

		HWND hwndList = GetDlgItem( hDlg, IDC_LIST );
		ListView_SetExtendedListViewStyleEx( hwndList, LVS_EX_CHECKBOXES, LVS_EX_CHECKBOXES );

		LV_COLUMN lvC;
		ZeroMemory( &lvC, sizeof(lvC) );
		lvC.mask = LVCF_FMT | LVCF_WIDTH | LVCF_TEXT | LVCF_SUBITEM;
		lvC.fmt = LVCFMT_LEFT;
		lvC.pszText = szText;
		RECT rc;
		GetWindowRect( hwndList, &rc );
		lvC.cx = rc.right - rc.left - GetSystemMetrics( SM_CXVSCROLL ) - GetSystemMetrics( SM_CXEDGE ) * 2;
		VERIFY( ListView_InsertColumn( hwndList, 0, &lvC ) != -1 );

		_ASSERT( hwndList );
		ListView_DeleteAllItems( hwndList );
		LV_ITEM item;
		ZeroMemory( &item, sizeof(item) );
		item.mask = LVIF_TEXT;

		size_t cchBuf = Editor_EnumConfig( m_hWnd, NULL, 0 );
		if( !cchBuf )  return;

		LPWSTR pszBuf = new WCHAR[ cchBuf ];
		if( !pszBuf )  return;
		
		if( !Editor_EnumConfig( m_hWnd, pszBuf, cchBuf ) )  return;

		int i = 0;
		LPWSTR p = pszBuf;
		while( *p ){
			item.iItem = i+1;
			item.pszText = p;
			i = ListView_InsertItem( hwndList, &item );
			if( ConfigExist( p ) ){
				ListView_SetCheckState( hwndList, i, TRUE );
			}
			p += wcslen( p ) + 1;
		}

		delete [] pszBuf;

		EnableWindow( GetDlgItem( hDlg, IDC_LIST ), m_bAutoDisplay );
	}

	void UpdateIconColorButton( HWND hDlg )
	{
		TCHAR szColor[16];
		StringPrintf( szColor, _countof( szColor ), _T("#%02X%02X%02X"),
			GetRValue( m_crCustomIcon ), GetGValue( m_crCustomIcon ), GetBValue( m_crCustomIcon ) );
		SetDlgItemText( hDlg, IDC_BTN_ICON_COLOR, szColor );
	}

	// TEMPORARY trace for the preview path; remove once the preview
	// behavior is confirmed stable
	void RbLogF( const char* pszFmt, ... )
	{
		FILE* f = _wfopen( L"E:\\Projects\\RichBar\\rb_debug.log", L"a" );
		if( !f )  return;
		SYSTEMTIME st;
		GetLocalTime( &st );
		fprintf( f, "[%02d:%02d:%02d] ", st.wHour, st.wMinute, st.wSecond );
		va_list args;
		va_start( args, pszFmt );
		vfprintf( f, pszFmt, args );
		va_end( args );
		fprintf( f, "\n" );
		fclose( f );
	}

	void OnPropCommand( HWND hDlg, WPARAM wParam )
	{
		if( wParam == IDOK ){
			m_bAutoDisplay = !!IsDlgButtonChecked( hDlg, IDC_AUTO_DISPLAY );
			m_bCustomIconColor = IsDlgButtonChecked( hDlg, IDC_RADIO_ICON_CUSTOM ) ? true : false;

			m_AutoConfigArray.clear();
			HWND hwndList = GetDlgItem( hDlg, IDC_LIST );
			int nCount = ListView_GetItemCount( hwndList );
			for( int i = 0; i < nCount; i++ ){
				if( ListView_GetCheckState( hwndList, i ) ){
					TCHAR szName[ MAX_CONFIG_NAME ];
					szName[0] = 0;
					ListView_GetItemText( hwndList, i, 0, szName, _countof( szName ) );
					m_AutoConfigArray.push_back( szName );
				}
			}
			SaveProfile();
			EndDialog( hDlg, IDOK );

			// the icon color changed: the bar must be re-created so the
			// glyph color and the dark copies match the new setting
			if( m_bIconColorDirty && m_hwndToolbar && m_bVisible ){
				Editor_ToolbarClose( m_hWnd, m_nClientID );
				CustomBarClosed();
				DisplayBar( true );
			}
		}
		else if( wParam == IDCANCEL ){
			EndDialog( hDlg, IDCANCEL );
		}
		else if( wParam == IDC_AUTO_DISPLAY ){
			BOOL bEnabled = IsDlgButtonChecked( hDlg, IDC_AUTO_DISPLAY );
			EnableWindow( GetDlgItem( hDlg, IDC_LIST ), bEnabled );
		}
		else if( wParam == IDC_RADIO_ICON_AUTO || wParam == IDC_RADIO_ICON_CUSTOM ){
			m_bIconColorDirty = true;
		}
		else if( wParam == IDC_BTN_ICON_COLOR ){
			CHOOSECOLOR cc = {};
			static COLORREF acrCust[16] = {};
			cc.lStructSize = sizeof( cc );
			cc.hwndOwner = hDlg;
			cc.rgbResult = m_crCustomIcon;
			cc.lpCustColors = acrCust;
			cc.Flags = CC_FULLOPEN | CC_RGBINIT;
			if( ChooseColor( &cc ) ){
				m_crCustomIcon = cc.rgbResult;
				CheckRadioButton( hDlg, IDC_RADIO_ICON_AUTO, IDC_RADIO_ICON_CUSTOM, IDC_RADIO_ICON_CUSTOM );
				UpdateIconColorButton( hDlg );
				m_bIconColorDirty = true;
			}
		}
		else if( wParam == IDC_CUSTOMIZE ){
			OnCustomize( hDlg );
		}
	}

	void LoadConfigArray( LPCTSTR pszKey, LPCTSTR pszSizeKey, vector<tstring>& arrConfig, LPCTSTR pszDefault )
	{
		bool bSuccess = false;
		arrConfig.clear();

		int cchSize = GetProfileInt( pszSizeKey, 0 );
		if( cchSize > 2 ){
			LPTSTR pBuf = new TCHAR[ cchSize ];
			if( pBuf ){
				*pBuf = 0;
				GetProfileString( pszKey, pBuf, cchSize, _T("") );
				if( *pBuf ){
					LPTSTR p = pBuf;
					for( ;; ){
						LPTSTR p0 = p;
						p = _tcschr( p, '\\' );
						if( !p )  break;
						*p = 0;
						if( !*p0 )  break;
						arrConfig.push_back( p0 );
						p++;
					}
					bSuccess = true;
				}
				delete [] pBuf;
			}
		}
		if( !bSuccess && pszDefault && pszDefault[0] ){
			arrConfig.push_back( pszDefault );
		}
	}

	void SaveConfigArray( LPCTSTR pszKey, LPCTSTR pszSizeKey, vector<tstring>& arrConfig )
	{
		int cchBuf = 2;
		for( vector<tstring>::iterator it = arrConfig.begin(); it != arrConfig.end(); it++ ){
			cchBuf += (int)it->length() + 1;
		}
		LPTSTR pBuf = new TCHAR[ cchBuf ];
		LPTSTR p = pBuf;
		int cch = cchBuf;
		for( vector<tstring>::iterator it = arrConfig.begin(); it != arrConfig.end(); it++ ){
			StringCopy( p, cch, it->c_str() );
			p += it->length();
			*p++ = _T('\\');
			cch -= (int)it->length() + 1;
		}
		*p++ = _T('\\');
		*p = 0;
		_ASSERT( lstrlen( pBuf ) + 1 == cchBuf );
		WriteProfileString( pszKey, pBuf );
		delete [] pBuf;
		WriteProfileInt( pszSizeKey, cchBuf );
	}

	void LoadProfile()
	{
		if( !m_bProfileLoaded ){
			m_bProfileLoaded = true;
			m_bOpenStartup = !!GetProfileInt( _T("OpenStartup"), FALSE );
			m_bAutoDisplay = !!GetProfileInt( _T("AutoDisplay"), FALSE );
			m_bDesignViewOn = !!GetProfileInt( _T("DesignViewOn"), FALSE );
			m_bPreviewOn = !!GetProfileInt( _T("PreviewOn"), FALSE );
			m_bCustomIconColor = !!GetProfileInt( _T("IconColorMode"), FALSE );
			m_crCustomIcon = (COLORREF)GetProfileInt( _T("IconColor"), (int)RGB( 224, 224, 224 ) );
			m_cx = GetProfileInt( _T("cx"), 0 );
			m_fStyle = GetProfileInt( _T("Style"), 0 );
			m_nBand = GetProfileInt( _T("Band"), -1 );
			m_wRows = (WORD)GetProfileInt( _T("Rows"), 3 );
			m_wColumns = (WORD)GetProfileInt( _T("Columns"), 2 );

			LoadConfigArray( _T("Configs"), _T("Configs-Size"), m_AutoConfigArray, _T("HTML") );
			LoadConfigArray( _T("MdConfigs"), _T("MdConfigs-Size"), m_MdConfigArray, _T("Markdown") );
		}
	}

	void SaveProfile()
	{
		if( m_bUninstalling )  return;
//		WriteProfileInt( _T("OpenStartup"), m_bOpenStartup );
		WriteProfileInt( _T("AutoDisplay"), !!m_bAutoDisplay );
		WriteProfileInt( _T("DesignViewOn"), !!m_bDesignViewOn );
		WriteProfileInt( _T("PreviewOn"), !!m_bPreviewOn );
		WriteProfileInt( _T("IconColorMode"), !!m_bCustomIconColor );
		WriteProfileInt( _T("IconColorMode"), !!m_bCustomIconColor );
		WriteProfileInt( _T("IconColor"), (int)m_crCustomIcon );
		WriteProfileInt( _T("cx"), m_cx );
		WriteProfileInt( _T("Style"), m_fStyle );
		WriteProfileInt( _T("Band"), m_nBand );

		SaveConfigArray( _T("Configs"), _T("Configs-Size"), m_AutoConfigArray );
		SaveConfigArray( _T("MdConfigs"), _T("MdConfigs-Size"), m_MdConfigArray );
	}

	int PopupMenuSub( UINT nIDCommand, UINT nIDMenu )
	{
		_ASSERT( m_hwndToolbar != NULL );
		if( m_hwndToolbar == NULL )  return 0;
		RECT rect = { 0 };
		int nIndex = (int)SendMessage( m_hwndToolbar, TB_COMMANDTOINDEX, nIDCommand, 0L );
		_ASSERT( nIndex >= 0 );
		if( nIndex != -1 ){
			SendMessage( m_hwndToolbar, TB_GETITEMRECT, nIndex, (LPARAM)&rect );
//			rect.top = rect.bottom;
		}
	//if( nIndex == -1 ){
	//	::ClientToScreen( m_hwndToolbar, (LPPOINT)&rect );
	//}
		::ClientToScreen( m_hwndToolbar, (LPPOINT)&rect.left );
		::ClientToScreen( m_hwndToolbar, (LPPOINT)&rect.right );

		HMENU hMainMenu = LoadMenu( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE(nIDMenu) );
		HMENU hMenu = GetSubMenu( hMainMenu, 0 );

		if( nIDMenu == IDR_POPUP_FONT ){
			int i = 1;
			for( vector<tstring>::iterator it = m_RecentFontArray.begin(); it != m_RecentFontArray.end(); it++ ){
				InsertMenu( hMenu, 0, MF_BYPOSITION, i++, it->c_str() );
			}
		}

		//TPMPARAMS tpmp;
		//ZeroMemory( &tpmp, sizeof( tpmp ) );
		//tpmp.cbSize = sizeof( tpmp );
		//tpmp.rcExclude.right = rect.left;
		//tpmp.rcExclude.left = INT_MIN;
		//tpmp.rcExclude.top = INT_MIN;
		//tpmp.rcExclude.bottom = INT_MAX;

		BOOL bRightAlign = GetSystemMetrics( SM_MENUDROPALIGNMENT );
		int nResult = TrackPopupMenuEx( hMenu, (bRightAlign ? TPM_RIGHTALIGN : TPM_LEFTALIGN) | TPM_RIGHTBUTTON | TPM_RETURNCMD, bRightAlign ? rect.right : rect.left, rect.bottom, m_hDlg, NULL );
		DestroyMenu( hMainMenu );
		return nResult;
	}



	void InsertTag( LPCTSTR pszTagBegin, LPCTSTR pszTagEnd, bool bToggle = false )
	{
		int nSelType = Editor_GetSelTypeEx( m_hWnd, TRUE );
		int nTagBeginLen = (int)_tcslen( pszTagBegin );
		int nTagEndLen = (int)_tcslen( pszTagEnd );
		if( nSelType & SEL_TYPE_SELECTED ){
			UINT_PTR nBufSize = Editor_GetSelTextW( m_hWnd, 0, NULL );
			nBufSize += nTagBeginLen + nTagEndLen + 8;
			LPWSTR pBuf = new WCHAR[ nBufSize ];
			if( pBuf ){
				POINT_PTR ptSelStart;
				POINT_PTR ptSelEnd;
				Editor_GetSelStart( m_hWnd, POS_LOGICAL_W, &ptSelStart );
				Editor_GetSelEnd( m_hWnd, POS_LOGICAL_W, &ptSelEnd );
				if( ptSelStart.y > ptSelEnd.y || (ptSelStart.y == ptSelEnd.y && ptSelStart.x > ptSelEnd.x) ){
					POINT_PTR pt;
					pt.x = ptSelStart.x;
					pt.y = ptSelStart.y;
					ptSelStart.x = ptSelEnd.x;
					ptSelStart.y = ptSelEnd.y;
					ptSelEnd.x = pt.x;
					ptSelEnd.y = pt.y;
				}

				bool bUnwrap = false;
				LPWSTR pszSel = new WCHAR[ nBufSize ];
				if( pszSel ){
					Editor_GetSelTextW( m_hWnd, (UINT)nBufSize, pszSel );
					int nSelLen = (int)wcslen( pszSel );
					bUnwrap = bToggle && nTagBeginLen > 0 && nTagEndLen > 0 && nSelLen >= nTagBeginLen + nTagEndLen &&
						_tcsnicmp( pszSel, pszTagBegin, nTagBeginLen ) == 0 &&
						_tcsnicmp( pszSel + nSelLen - nTagEndLen, pszTagEnd, nTagEndLen ) == 0;
					if( bUnwrap ){
						// the selection is already wrapped: replace it with the inner text only
						int nInnerLen = nSelLen - nTagBeginLen - nTagEndLen;
						wmemmove( pszSel, pszSel + nTagBeginLen, nInnerLen );
						pszSel[nInnerLen] = L'\0';
						Editor_SetCaretPosEx( m_hWnd, POS_LOGICAL_W, &ptSelStart, FALSE );
						Editor_SetCaretPosEx( m_hWnd, POS_LOGICAL_W, &ptSelEnd, TRUE );
						Editor_InsertW( m_hWnd, pszSel, true );
					}
					delete [] pszSel;
				}

				if( bUnwrap ){
					delete [] pBuf;
					return;
				}

				StringCopy( pBuf, nBufSize, pszTagBegin );
				Editor_GetSelTextW( m_hWnd, (UINT)( nBufSize - nTagBeginLen ), pBuf + nTagBeginLen );
				StringCat( pBuf, nBufSize, pszTagEnd );

				bool bNL = _tcschr( pBuf, '\r' ) || _tcschr( pBuf, '\n' );

				Editor_InsertW( m_hWnd, pBuf, true );
				Editor_SetCaretPosEx( m_hWnd, POS_LOGICAL_W, &ptSelStart, FALSE );
				ptSelEnd.x += nTagEndLen;
				if( !bNL ) {
					ptSelEnd.x += nTagBeginLen;
				}
				Editor_SetCaretPosEx( m_hWnd, POS_LOGICAL_W, &ptSelEnd, TRUE );
				delete [] pBuf;
			}
		}
		else {
			if( pszTagBegin[0] ){
				Editor_InsertW( m_hWnd, pszTagBegin, true );
			}
			if( pszTagEnd[0] ){
				Editor_InsertW( m_hWnd, pszTagEnd, true );
			}
			for( int i = 0; i < nTagEndLen; i++ ){
				Editor_ExecCommand( m_hWnd, EEID_LEFT );
			}
		}
	}

	static int MdPrefixMatch( LPCWSTR pszLine, LPCWSTR pszPrefix )
	{
		// length of pszPrefix found at the start of pszLine, 0 if none;
		// for the numbered list prefix, any "N. " counts as "1. "
		size_t nLen = wcslen( pszPrefix );
		if( _wcsnicmp( pszLine, pszPrefix, nLen ) == 0 ){
			return (int)nLen;
		}
		if( wcscmp( pszPrefix, L"1. " ) == 0 ){
			int i = 0;
			while( pszLine[i] >= L'0' && pszLine[i] <= L'9' )  i++;
			if( i > 0 && pszLine[i] == L'.' && pszLine[i+1] == L' ' ){
				return i + 2;
			}
		}
		return 0;
	}

	static int MdStripLen( LPCWSTR pszLine )
	{
		// length of any existing Markdown line prefix to strip before applying a new one
		if( pszLine[0] == L'#' ){
			int i = 0;
			while( pszLine[i] == L'#' )  i++;
			if( i >= 1 && i <= 6 && pszLine[i] == L' ' )  return i + 1;
			return 0;
		}
		if( _wcsnicmp( pszLine, L"- [ ] ", 6 ) == 0 || _wcsnicmp( pszLine, L"- [x] ", 6 ) == 0 ||
			_wcsnicmp( pszLine, L"- [X] ", 6 ) == 0 ){
			return 6;
		}
		if( ( pszLine[0] == L'-' || pszLine[0] == L'*' || pszLine[0] == L'+' ) && pszLine[1] == L' ' ){
			return 2;
		}
		if( pszLine[0] == L'>' && pszLine[1] == L' ' ){
			return 2;
		}
		{
			int i = 0;
			while( pszLine[i] >= L'0' && pszLine[i] <= L'9' )  i++;
			if( i > 0 && pszLine[i] == L'.' && pszLine[i+1] == L' ' ){
				return i + 2;
			}
		}
		return 0;
	}

	void InsertLinePrefix( LPCWSTR pszPrefix )
	{
		int nSelType = Editor_GetSelTypeEx( m_hWnd, TRUE );
		POINT_PTR ptStart, ptEnd;
		if( nSelType & SEL_TYPE_SELECTED ){
			Editor_GetSelStart( m_hWnd, POS_LOGICAL_W, &ptStart );
			Editor_GetSelEnd( m_hWnd, POS_LOGICAL_W, &ptEnd );
			if( ptStart.y > ptEnd.y || ( ptStart.y == ptEnd.y && ptStart.x > ptEnd.x ) ){
				POINT_PTR pt = ptStart;
				ptStart = ptEnd;
				ptEnd = pt;
			}
		}
		else {
			Editor_GetCaretPos( m_hWnd, POS_LOGICAL_W, &ptStart );
			ptEnd = ptStart;
		}

		int nLines = (int)( ptEnd.y - ptStart.y ) + 1;
		LPWSTR* apszLines = new LPWSTR[ nLines ];
		bool* abHas = new bool[ nLines ];
		for( int i = 0; i < nLines; i++ ){
			GET_LINE_INFO gli;
			gli.cch = 0;
			gli.flags = 0;
			gli.yLine = (UINT)( ptStart.y + i );
			UINT_PTR cch = Editor_GetLineW( m_hWnd, &gli, NULL );
			apszLines[i] = new WCHAR[ cch + 1 ];
			gli.cch = cch + 1;
			Editor_GetLineW( m_hWnd, &gli, apszLines[i] );
			abHas[i] = MdPrefixMatch( apszLines[i], pszPrefix ) != 0 || apszLines[i][0] == L'\0';
		}

		bool bRemove = true;
		for( int i = 0; i < nLines; i++ ){
			if( !abHas[i] ){
				bRemove = false;
				break;
			}
		}

		WCHAR szNum[16];
		int nNum = 1;
		for( int i = 0; i < nLines; i++ ){
			POINT_PTR ptCur;
			ptCur.x = 0;
			ptCur.y = ptStart.y + i;
			int nStrip = 0;
			if( bRemove ){
				nStrip = MdPrefixMatch( apszLines[i], pszPrefix );
			}
			else {
				nStrip = MdStripLen( apszLines[i] );
			}
			if( nStrip > 0 ){
				Editor_SetCaretPosEx( m_hWnd, POS_LOGICAL_W, &ptCur, FALSE );
				POINT_PTR ptTo = ptCur;
				ptTo.x = nStrip;
				Editor_SetCaretPosEx( m_hWnd, POS_LOGICAL_W, &ptTo, TRUE );
				Editor_ExecCommand( m_hWnd, EEID_DELETE );
			}
			if( !bRemove && ( apszLines[i][0] != L'\0' || nLines == 1 ) ){
				LPCWSTR pszUse = pszPrefix;
				if( wcscmp( pszPrefix, L"1. " ) == 0 ){
					StringPrintf( szNum, _countof( szNum ), L"%d. ", nNum );
					pszUse = szNum;
				}
				Editor_SetCaretPosEx( m_hWnd, POS_LOGICAL_W, &ptCur, FALSE );
				Editor_InsertW( m_hWnd, pszUse, false );
				nNum++;
			}
			delete [] apszLines[i];
		}
		delete [] apszLines;
		delete [] abHas;
	}

	void InsertTagFont( LPCTSTR szFaceName )
	{
		TCHAR szTagBegin[80];
		StringPrintf( szTagBegin, _countof( szTagBegin ), _T("<font face=\"%s\">"), szFaceName );
		InsertTag( szTagBegin, _T("</font>") );

		for( vector<tstring>::iterator it = m_RecentFontArray.begin(); it != m_RecentFontArray.end(); it++ ){
			if( lstrcmp( it->c_str(), szFaceName ) == 0 ){
				m_RecentFontArray.erase( it );
				break;
			}
		}
		m_RecentFontArray.push_back( szFaceName );
		if( m_RecentFontArray.size() >= MAX_RECENT_FONT ){
			m_RecentFontArray.erase( m_RecentFontArray.begin() );
		}
	}

	void Unindent()
	{
		int nSelType = Editor_GetSelTypeEx( m_hWnd, TRUE );
		if( nSelType & SEL_TYPE_SELECTED ){
			UINT_PTR nBufSize = Editor_GetSelTextW( m_hWnd, 0, NULL );

			LPWSTR pBuf = new WCHAR[ nBufSize ];
			if( pBuf ){
				Editor_GetSelTextW( m_hWnd, nBufSize, pBuf );
				LPCTSTR pszBegin = _T("<blockquote>");
				int nBeginLen = lstrlen( pszBegin );
				LPCTSTR pszEnd = _T("</blockquote>");
				int nEndLen = lstrlen( pszEnd );
				LPTSTR p1 = StrStrI( pBuf, pszBegin );
				if( p1 ){
					wmemmove( p1, p1 + nBeginLen, lstrlen( p1 + nBeginLen ) + 1 );
					LPTSTR p2 = StrStrI( p1, pszEnd );
					if( p2 ){
						wmemmove( p2, p2 + nEndLen, lstrlen( p2 + nEndLen ) + 1 );
						Editor_InsertW( m_hWnd, pBuf, false );
					}
				}
				delete [] pBuf;
			}
		}
	}

	void OnFont()
	{
		LOGFONT lf = { 0 };
		HFONT hFont = (HFONT)GetStockObject( DEFAULT_GUI_FONT );
		if( hFont ){
			GetObject( hFont, sizeof( lf ), &lf );
		}
		CHOOSEFONT cf = { 0 };
		cf.lStructSize = sizeof( cf );
		cf.hwndOwner = m_hDlg;
		cf.lpLogFont = &lf;
		cf.hInstance = EEGetLocaleInstanceHandle();
		cf.lpTemplateName = MAKEINTRESOURCE( IDD_FONT );
		cf.Flags = CF_SCREENFONTS | CF_NOVERTFONTS | CF_ENABLETEMPLATE | CF_INITTOLOGFONTSTRUCT;
		if( ChooseFont( &cf ) ) {
			InsertTagFont( lf.lfFaceName );
		}
	}


	void OnModeSwitch( int iMode )
	{
		// manual override: sticks until the document or configuration changes
		m_iModeOverride = iMode;
		// NOTE: the document configuration is deliberately NOT touched here.
		// Switching the config re-evaluates EmEditor's per-config toolbar
		// visibility, which resurrects the OFFICIAL toolbar the user hid and
		// can drop our custom bar during the relayout. Saved .md/.html files
		// already sit on the right config via associations; the preview
		// pipeline cost for mismatched unsaved docs is the lesser evil.
		if( m_iMode != iMode ){
			m_iMode = iMode;
			if( IsLivePreviewOpen() ){
				NavigateLivePreview();	// retarget the pane to the new mode
			}
			if( m_hwndToolbar && m_bVisible ){
				// re-create the custom bar so it shows the other mode's button set
				Editor_ToolbarClose( m_hWnd, m_nClientID );
				CustomBarClosed();
				DisplayBar( true );
			}
		}
		else {
			SyncModeSwitchCheck();
		}
	}

	void SyncModeSwitchCheck()
	{
		if( m_hwndToolbar && IsWindow( m_hwndToolbar ) ){
			SendMessage( m_hwndToolbar, TB_CHECKBUTTON, ID_MODE_HTML, MAKELPARAM( m_iMode == MODE_HTML, 0 ) );
			SendMessage( m_hwndToolbar, TB_CHECKBUTTON, ID_MODE_MD, MAKELPARAM( m_iMode == MODE_MD, 0 ) );
		}
	}

	HBRUSH GetVeryDarkBrush( HWND hwnd, HDC hdc )
	{
		// official Very Dark adaptation: EmEditor hands out its dark background
		// brush so the plug-in's dialog blends into the black band area
		if( IsVeryDark() ){
			return (HBRUSH)Editor_Info( hwnd, EI_WM_CTLCOLOR, (LPARAM)hdc );
		}
		return NULL;
	}

	void OnThemeChanged( HWND hwnd )
	{
		Editor_Info( hwnd, EI_WM_THEMECHANGED, (LPARAM)hwnd );
		// re-create the bar when the glyph color flipped with the theme.
		// Leaving Very Dark never updates the queryable scheme state before
		// relaunch — confirmed upstream: EI_IS_VERY_DARK and
		// EI_GET_BAR_BACK_COLOR stay pinned, so nothing a plug-in polls,
		// rechecks or gets notified with can see that switch; the flip takes
		// a relaunch until fixed in EmEditor itself
		if( m_hwndToolbar ){
			COLORREF crFg = GetBarGlyphColor();
			if( crFg != m_crGlyphFg ){
				Editor_ToolbarClose( m_hWnd, m_nClientID );
				CustomBarClosed();
				DisplayBar( m_bVisible );
			}
		}
	}

	void OnDlgCommand( WPARAM wParam )
	{
		if( wParam == ID_MODE_HTML || wParam == ID_MODE_MD ){
			OnModeSwitch( ( wParam == ID_MODE_MD ) ? MODE_MD : MODE_HTML );
			return;
		}
		if( wParam >= ID_COMMAND_BASE && wParam < ID_COMMAND_BASE + Cmds().size() ) {
			CCmd& cmd = Cmds()[wParam - ID_COMMAND_BASE];
			if( cmd.m_iCmd == CMD_TAGS ){
				BOOL bResult;
				wstring sTagBegin = UnescapeString( cmd.m_sTagBegin.c_str(), &bResult );
				if( bResult ){
					wstring sTagEnd = UnescapeString( cmd.m_sTagEnd.c_str(), &bResult );
					if( bResult ){
						InsertTag( sTagBegin.c_str(), sTagEnd.c_str(), true );
					}
				}
			}
			else if( cmd.m_iCmd == CMD_INSERT_TABLE ){
				if( DialogBox( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE( IDD_TABLE ), m_hDlg, TableDlg ) == IDOK ){
					if( m_iMode == MODE_MD ){
						wstring sTable = L"|";
						for( WORD j = 0; j < m_wColumns; j++ ){
							sTable += L" |";
						}
						sTable += L"\n|";
						for( WORD j = 0; j < m_wColumns; j++ ){
							sTable += L" --- |";
						}
						sTable += L"\n";
						for( WORD i = 0; i < m_wRows; i++ ){
							sTable += L"|";
							for( WORD j = 0; j < m_wColumns; j++ ){
								sTable += L" |";
							}
							sTable += L"\n";
						}
						Editor_InsertW( m_hWnd, sTable.c_str(), true );
					}
					else {
						Editor_InsertW( m_hWnd, _T("<table>\n"), true );
						for( WORD i = 0; i < m_wRows; i++ ){
							Editor_InsertW( m_hWnd, _T("\t<tr>\n"), true );
							for( WORD j = 0; j < m_wColumns; j++ ){
								Editor_InsertW( m_hWnd, _T("\t\t<td></td>\n"), true );
							}
							Editor_InsertW( m_hWnd, _T("\t</tr>\n"), true );
						}
						Editor_InsertW( m_hWnd, _T("</table>\n"), true );
					}
				}
			}
			else if( cmd.m_iCmd == CMD_LINE_PREFIX ){
				InsertLinePrefix( cmd.m_sTagBegin.c_str() );
			}
			else if( cmd.m_iCmd == CMD_FONT ){
				OnFont();
			}
			else if( cmd.m_iCmd == CMD_UNINDENT ){
				Unindent();
			}
			else if( cmd.m_iCmd == CMD_CUSTOMIZE ){
				OnCustomize( m_hWnd );
			}
			else if( cmd.m_iCmd == CMD_MD_VIEW ){
				// BTNS_CHECK toggled the control state before this command
				// arrived: that is the WANTED state. The design view is toggled
				// with 23255 (the only command that drives it); 23255 auto-shows
				// the built-in markdown bar, so the deferred timer queries the
				// bar's own EE_QUERY_STATUS and hides it back if it came up
				m_bDesignViewOn = ( SendMessage( m_hwndToolbar, TB_GETSTATE, wParam, 0 ) & TBSTATE_CHECKED ) != 0;
								SaveProfile();				// persists the global flag for cross-session restore
				ApplyToggleStates();
				RbLogF( "design click: want=%d -> 23255", (int)m_bDesignViewOn );
				PostMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_MARKDOWN_VIEW, 0 ), 0 );
				if( m_hDlg ){
					SetTimer( m_hDlg, IDT_DESIGN_SYNC, 200, NULL );
				}
			}
			else if( cmd.m_iCmd == CMD_PREVIEW ){
				// our own live preview pane: the control state IS the wanted
				// state and the bar follows it directly
				bool bWant = ( SendMessage( m_hwndToolbar, TB_GETSTATE, wParam, 0 ) & TBSTATE_CHECKED ) != 0;
				bool bPane = IsOfficialPaneVisible();
				SetPreviewDocOn( bWant );	// per-document memory (follows the doc)
				m_bPreviewOn = bWant;
				SaveProfile();
				ApplyToggleStates();
				if( bWant != bPane ){
					RbLogF( "preview click: want=%d pane=%d -> official 23275", (int)bWant, (int)bPane );
					// unsaved documents: the official snapshot pipeline keys the
					// markdown-vs-html choice off the temp file extension, which
					// follows the document CONFIG - align it with our mode so
					// unsaved Markdown previews convert (saved files already
					// carry the right config and extension)
					TCHAR szFile[ MAX_PATH ] = { 0 };
					Editor_Info( m_hWnd, EI_GET_FILE_NAMEW, (LPARAM)szFile );
					if( szFile[0] == 0 || _tcschr( szFile, _T('\\') ) == NULL ){
						Editor_SetConfigW( m_hWnd, ( m_iMode == MODE_MD ) ? L"Markdown" : L"HTML" );
						RbLogF( "preview: unsaved -> config=%s", ( m_iMode == MODE_MD ) ? "Markdown" : "HTML" );
					}
					PostMessage( m_hWnd, WM_COMMAND, MAKEWPARAM( EEID_MARKDOWN_PREVIEW, 0 ), 0 );
				}
			}
			else if( cmd.m_iCmd == CMD_REFRESH_PREVIEW ){
				// deliver the CURRENT buffer to the preview WITHOUT closing it.
				// Unsaved documents: the pane renders a %TEMP% EEWxxxx.htm
				// snapshot written by the plug-in — rewrite the newest one with
				// the live buffer and reload the pane browser in place. Saved
				// documents render their disk file, so the reload re-reads it
				// (save to see edits there).
				HWND hwndPane = NULL;
				EnumChildWindows( m_hWnd, FindOfficialPaneProc, (LPARAM)&hwndPane );
				if( !hwndPane ){
					return;	// nothing to refresh
				}
				TCHAR szFile[ MAX_PATH ] = { 0 };
				Editor_Info( m_hWnd, EI_GET_FILE_NAMEW, (LPARAM)szFile );
				const bool bUnsaved = ( szFile[0] == 0 ) || ( _tcschr( szFile, _T('\\') ) == NULL );
				RbLogF( "refresh preview: unsaved=%d", (int)bUnsaved );
				if( bUnsaved ){
					FeedPreviewSnapshot();
				}
				ReloadPreviewBrowser( hwndPane );
			}
			}


		//switch( wParam ){
		//case ID_PARAGRAPH:
		//	InsertTag( L"<p>", L"</p>" );
		//	break;
		//case ID_BREAK:
		//	InsertTag( L"<br />", L"" );
		//	break;
		//case ID_BOLD:
		//	InsertTag( L"<strong>", L"</strong>" );
		//	break;
		//case ID_ITALIC:
		//	InsertTag( L"<em>", L"</em>" );
		//	break;
		//case ID_UNDERLINE:
		//	InsertTag( L"<u>", L"</u>" );
		//	break;
		//case ID_FONT:
		//	{
		//		LOGFONT lf = { 0 };
		//		HFONT hFont = (HFONT)GetStockObject( DEFAULT_GUI_FONT );
		//		if( hFont ){
		//			GetObject( hFont, sizeof( lf ), &lf );
		//		}
		//		CHOOSEFONT cf = { 0 };
		//		cf.lStructSize = sizeof( cf );
		//		cf.hwndOwner = m_hDlg;
		//		cf.lpLogFont = &lf;
		//		cf.hInstance = EEGetInstanceHandle();
		//		cf.lpTemplateName = MAKEINTRESOURCE( IDD_FONT );
		//		cf.Flags = CF_SCREENFONTS | CF_NOVERTFONTS | CF_ENABLETEMPLATE | CF_INITTOLOGFONTSTRUCT;
		//		if( ChooseFont( &cf ) ) {
		//			InsertTagFont( lf.lfFaceName );
		//		}
		//	}
		//	break;
		//case ID_COLOR:
		//	{
		//		CHOOSECOLOR cc = { 0 };
		//		cc.lStructSize = sizeof( cc );
		//		cc.hwndOwner = m_hDlg;
		//		cc.lpCustColors = m_crCustClr;
		//		if( ChooseColor( &cc ) ){
		//			m_dwDefColor = cc.rgbResult;
		//			TCHAR sz[16];
		//			StringPrintf( sz, _countof( sz ), _T("#%02x%02x%02x"), GetRValue( cc.rgbResult ), GetGValue( cc.rgbResult ), GetBValue( cc.rgbResult ) );
		//			InsertTag( sz, _T("") );
		//		}
		//	}
		//	break;
		//case ID_PICTURE:
		//	{
		//		TCHAR szRelativePath[MAX_PATH];
		//		if( ChooseFile( szRelativePath, IDS_PICTURE, IDS_FILTER_IMAGE ) ){
		//			TCHAR szTag[MAX_PATH+40];
		//			StringPrintf( szTag, _countof( szTag ), _T("<img src=\"%s\" width=\"\" height=\"\" alt=\"\" />"), szRelativePath );
		//			InsertTag( szTag, _T("") );
		//		}
		//	}
		//	break;
		//case ID_HYPERLINK:
		//	{
		//		TCHAR szRelativePath[MAX_PATH];
		//		if( ChooseFile( szRelativePath, IDS_HYPERLINK, IDS_FILTER_HYPERLINK ) ){
		//			TCHAR szTag[MAX_PATH+40];
		//			StringPrintf( szTag, _countof( szTag ), _T("<a href=\"%s\">"), szRelativePath );
		//			InsertTag( szTag, _T("</a>") );
		//		}
		//	}
		//	break;
		//case ID_TABLE:
		//	{
		//		if( DialogBox( EEGetInstanceHandle(), MAKEINTRESOURCE( IDD_TABLE ), m_hDlg, TableDlg ) == IDOK ){
		//			Editor_InsertW( m_hWnd, _T("<table>\n"), true );
		//			for( WORD i = 0; i < m_wRows; i++ ){
		//				Editor_InsertW( m_hWnd, _T("\t<tr>\n"), true );
		//				for( WORD j = 0; j < m_wColumns; j++ ){
		//					Editor_InsertW( m_hWnd, _T("\t\t<td></td>\n"), true );
		//				}
		//				Editor_InsertW( m_hWnd, _T("\t</tr>\n"), true );
		//			}
		//			Editor_InsertW( m_hWnd, _T("</table>\n"), true );
		//		}
		//	}
		//	break;
		//case ID_HORZ_LINE:
		//	{
		//		InsertTag( _T("<hr />"), _T("") );
		//	}
		//	break;
		//case ID_COMMENT:
		//	{
		//		InsertTag( _T("<!-- "), _T(" -->") );
		//	}
		//	break;
		//case ID_ALIGN_LEFT:
		//	{
		//		InsertTag( _T("<p align=\"left\">"), _T("</p>") );
		//	}
		//	break;
		//case ID_CENTER:
		//	{
		//		InsertTag( _T("<p align=\"center\">"), _T("</p>") );
		//	}
		//	break;
		//case ID_ALIGN_RIGHT:
		//	{
		//		InsertTag( _T("<p align=\"right\">"), _T("</p>") );
		//	}
		//	break;
		//case ID_JUSTIFY:
		//	{
		//		InsertTag( _T("<p align=\"justify\">"), _T("</p>") );
		//	}
		//	break;
		//case ID_NUMBERING:
		//	{
		//		InsertTag( _T("<ol>\n\t<li>"), _T("</li>\n</ol>") );
		//	}
		//	break;
		//case ID_BULLETS:
		//	{
		//		InsertTag( _T("<ul>\n\t<li>"), _T("</li>\n</ul>") );
		//	}
		//	break;
		//case ID_UNINDENT:
		//	{
		//		Unindent();
		//	}
		//	break;
		//case ID_INDENT:
		//	{
		//		InsertTag( _T("<blockquote>"), _T("</blockquote>") );
		//	}
		//	break;
		//case ID_HIGHLIGHT:
		//	{
		//		TCHAR sz[260];
		//		StringPrintf( sz, _countof( sz ), _T("<span style=\"background-color: #%02x%02x%02x\">"), GetRValue( m_dwDefColor ), GetGValue( m_dwDefColor ), GetBValue( m_dwDefColor ) );
		//		InsertTag( sz, _T("</span>") );
		//	}
		//	break;
		//case ID_FONT_COLOR:
		//	{
		//		TCHAR sz[260];
		//		StringPrintf( sz, _countof( sz ), _T("<font color=\"#%02x%02x%02x\">"), GetRValue( m_dwDefColor ), GetGValue( m_dwDefColor ), GetBValue( m_dwDefColor ) );
		//		InsertTag( sz, _T("</font>") );
		//	}
		//	break;
		//}
	}

	bool IsDropdownCmdCode( int iCmd )
	{
		switch( iCmd ){
		case CMD_FONT:
		case CMD_DROPDOWN_HEADER:
		case CMD_DROPDOWN_FORM:
		case CMD_ICON_COLOR:
			return true;
		}
		return false;
	}

	bool IsDropdownCommand( UINT nIDCommand )
	{
		if( nIDCommand < ID_COMMAND_BASE || nIDCommand >= ID_COMMAND_BASE + Cmds().size() ){
			return false;
		}
		return IsDropdownCmdCode( Cmds()[nIDCommand - ID_COMMAND_BASE].m_iCmd );
	}

	void ShowDropdownMenu( UINT nIDCommand, bool bPressedByMouse )
	{
		CCmd& cmd = Cmds()[nIDCommand - ID_COMMAND_BASE];
		// Pressed buttons draw from the normal list, whose light glyphs wash
		// out on the light pressed fill on a dark band. That list carries
		// dark copies of every image after m_nLightIcons (mirroring the hot
		// list), so point just this button at its dark variant. A menu opened
		// by hovering never presses the button: while the menu tracks we
		// swallow the toolbar's WM_MOUSELEAVE (see ToolbarProc), so the hot
		// look simply never fades and the glyph never shifts.
		// The tooltip has had its time by now (the menu delay is the tooltip
		// delay plus a margin); retire it so the menu owns the spot below
		// the button instead of the two popups overlapping.
		HWND hwndTips = m_hwndToolbar ? (HWND)SendMessage( m_hwndToolbar, TB_GETTOOLTIPS, 0, 0 ) : NULL;
		if( hwndTips ){
			SendMessage( hwndTips, TTM_POP, 0, 0 );
		}
		m_bInDropdownMenu = true;
		switch( cmd.m_iCmd ){
		case CMD_FONT:
			{
				int n = PopupMenuSub( nIDCommand, IDR_POPUP_FONT );
				if( n == 999 ){
					OnFont();
				}
				else if( n > 0 ){
					_ASSERT( n - 1 < (int)m_RecentFontArray.size() );
					TCHAR sz[LF_FACESIZE];
					StringCopy( sz, _countof( sz ), m_RecentFontArray[n - 1].c_str() );
					InsertTagFont( sz );
				}
			}
			break;

		case CMD_DROPDOWN_HEADER:
			{
				int n = PopupMenuSub( nIDCommand, IDR_POPUP_HEADER );
				if( n > 0 ){
					TCHAR szTagBegin[8], szTagEnd[8];
					StringPrintf( szTagBegin, _countof( szTagBegin ), _T("<h%d>"), n );
					StringPrintf( szTagEnd, _countof( szTagEnd ), _T("</h%d>"), n );
					InsertTag( szTagBegin, szTagEnd );
				}
			}
			break;

		case CMD_DROPDOWN_FORM:
			{
				int n = PopupMenuSub( nIDCommand, IDR_POPUP_FORM );
				switch( n )	{
				case 1:
					InsertTag( _T("<form method=\"post\" action=\"\">\n\t"), _T("\n<input type=\"submit\"><input type=\"reset\"></form>\n") );
					break;
				case 2:
					InsertTag( _T("<input type=\"text\" id=\"\" />"), _T("") );
					break;
				case 3:
					InsertTag( _T("<textarea id=\"\" rows=\"3\" cols=\"30\">"), _T("</textarea>") );
					break;
				case 4:
					InsertTag( _T("<input type=\"checkbox\" id=\"\" />"), _T("") );
					break;
				case 5:
					InsertTag( _T("<input type=\"radio\" id=\"\" />"), _T("") );
					break;
				case 6:
					InsertTag( _T("<fieldset style=\"padding: 2\">\n<legend>Group Box"), _T("</legend></fieldset>") );
					break;
				case 7:
					InsertTag( _T("<select size=\"1\" id=\"\">"), _T("</select>") );
					break;
				case 8:
					InsertTag( _T("<input type=\"button\" value=\"Button\" id=\"\">"), _T("") );
					break;
				case 9:
					InsertTag( _T("<button id=\"\">Type Here"), _T("</button>") );
					break;
				}
			}
			break;

		case CMD_ICON_COLOR:
			{
				int n = PopupMenuSub( nIDCommand, IDR_POPUP_ICONCOLOR );
				bool bChanged = false;
				if( n == 1 ){	// Automatic
					if( m_bCustomIconColor ){
						m_bCustomIconColor = false;
						bChanged = true;
					}
				}
				else if( n == 2 ){	// Custom color
					CHOOSECOLOR cc = {};
					static COLORREF acrCust[16] = {};
					cc.lStructSize = sizeof( cc );
					cc.hwndOwner = m_hDlg;
					cc.rgbResult = m_crCustomIcon;
					cc.lpCustColors = acrCust;
					cc.Flags = CC_FULLOPEN | CC_RGBINIT;
					if( ChooseColor( &cc ) ){
						m_crCustomIcon = cc.rgbResult;
						m_bCustomIconColor = true;
						bChanged = true;
					}
				}
				if( bChanged ){
					SaveProfile();
					RebuildToolbarImages();
				}
			}
			break;

		}
		m_bInDropdownMenu = false;
		// A menu just opened here stays quiet until the mouse has actually
		// left the button, tracked deterministically in the mouse handlers.
		m_nLastMenuCmd = nIDCommand;
		m_bLastMenuLeft = false;
		// The menu loop consumed the mouse; if the cursor ended up outside
		// the toolbar, let the button's hot look clear right away.
		POINT pt = { 0, 0 };
		RECT rc = { 0, 0, 0, 0 };
		if( GetCursorPos( &pt ) && GetWindowRect( m_hwndToolbar, &rc ) && !PtInRect( &rc, pt ) ){
			SendMessage( m_hwndToolbar, WM_MOUSELEAVE, 0, 0 );
		}
	}

	void OnHoverMenuTimer()
	{
		KillTimer( m_hDlg, IDT_HOVER_MENU );
		UINT nCmd = m_nHoverMenuCmd;
		m_nHoverMenuCmd = 0;
		if( !nCmd || !m_hwndToolbar || m_bInDropdownMenu ){
			return;
		}
		// the mouse may have moved on while the delay ran: the cursor must
		// still sit inside the button's rect
		int nIndex = (int)SendMessage( m_hwndToolbar, TB_COMMANDTOINDEX, nCmd, 0L );
		if( nIndex < 0 ){
			return;
		}
		RECT rc = { 0, 0, 0, 0 };
		if( !SendMessage( m_hwndToolbar, TB_GETITEMRECT, nIndex, (LPARAM)&rc ) ){
			return;
		}
		MapWindowPoints( m_hwndToolbar, NULL, (POINT*)&rc, 2 );
		POINT pt = { 0, 0 };
		if( !GetCursorPos( &pt ) || !PtInRect( &rc, pt ) ){
			return;
		}
		ShowDropdownMenu( nCmd, false );
	}

	// Runs inside the toolbar subclass. Returns true when the message is
	// swallowed.
	bool OnToolbarMessage( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam )
	{
		if( msg == WM_MOUSELEAVE && m_bInDropdownMenu ){
			// the menu loop captured the mouse; the button must keep its hot
			// look for as long as its menu stays open, so the leave event is
			// quietly dropped instead of being forwarded to the toolbar
			return true;
		}
		if( msg == WM_MOUSEMOVE ){
			OnToolbarMouseMove( hwnd, lParam );
		}
		else if( msg == WM_MOUSELEAVE ){
			OnToolbarMouseLeave();
		}
		return false;
	}

	void OnToolbarMouseMove( HWND hwnd, LPARAM lParam )
	{
		POINT pt = { (short)LOWORD( lParam ), (short)HIWORD( lParam ) };
		UINT nCmd = 0;
		int nHit = (int)SendMessage( hwnd, TB_HITTEST, 0, (LPARAM)&pt );
		TBBUTTON tb = {};
		if( nHit >= 0 && SendMessage( hwnd, TB_GETBUTTON, nHit, (LPARAM)&tb ) && tb.idCommand >= ID_COMMAND_BASE ){
			nCmd = (UINT)tb.idCommand;
		}
		// deterministic leave tracking: any move onto another item or blank
		// space frees the last served button for a fresh hover-open
		if( m_nLastMenuCmd != 0 && nCmd != m_nLastMenuCmd ){
			m_bLastMenuLeft = true;
		}
		if( m_bInDropdownMenu ){
			return;
		}
		if( !IsDropdownCommand( nCmd ) ){
			if( m_nHoverMenuCmd != 0 ){
				KillTimer( m_hDlg, IDT_HOVER_MENU );
				m_nHoverMenuCmd = 0;
			}
			return;
		}
		if( nCmd == m_nLastMenuCmd && !m_bLastMenuLeft ){
			return;	// menu closed here moments ago; the mouse never left
		}
		if( nCmd == m_nHoverMenuCmd ){
			return;
		}
		KillTimer( m_hDlg, IDT_HOVER_MENU );
		m_nHoverMenuCmd = nCmd;
		// Word-style sequencing: the tooltip shows first, and only if the
		// mouse keeps resting on the button does the menu take over. So the
		// menu waits for the tooltip's own initial delay plus a reading
		// margin; ShowDropdownMenu then retires the tip via TTM_POP.
		DWORD dwDelay = 1000;
		HWND hwndTips = (HWND)SendMessage( hwnd, TB_GETTOOLTIPS, 0, 0 );
		if( hwndTips ){
			DWORD dwTip = (DWORD)SendMessage( hwndTips, TTM_GETDELAYTIME, TTDT_INITIAL, 0 );
			if( dwTip > 0 && dwTip < 3000 ){
				dwDelay = dwTip + 500;
			}
		}
		SetTimer( m_hDlg, IDT_HOVER_MENU, dwDelay, NULL );
	}

	void OnToolbarMouseLeave()
	{
		m_bLastMenuLeft = true;
		if( m_nHoverMenuCmd != 0 ){
			KillTimer( m_hDlg, IDT_HOVER_MENU );
			m_nHoverMenuCmd = 0;
		}
	}

	LRESULT OnDlgNotify( NMHDR* pnmh )
	{
		switch( pnmh->code ){
		case NM_CUSTOMDRAW:
			{
				// let the control paint everything, then draw the dropdown
				// arrow anchored to the item's real rect
				LPNMTBCUSTOMDRAW pTBCD = (LPNMTBCUSTOMDRAW)pnmh;
				if( pTBCD->nmcd.dwDrawStage == CDDS_PREPAINT ){
					return CDRF_NOTIFYITEMDRAW | TBCDRF_NOOFFSET;
				}
				if( pTBCD->nmcd.dwDrawStage == CDDS_ITEMPREPAINT ){
					return CDRF_NOTIFYPOSTPAINT;
				}
				if( pTBCD->nmcd.dwDrawStage == CDDS_ITEMPOSTPAINT ){
					UINT uID = (UINT)pTBCD->nmcd.dwItemSpec;
					// with the press offset suppressed, the control's normal
					// image sits exactly where we would place it: overdraw
					// the dark copy on hover/pressed, then the arrow
					DrawButtonStateImage( pTBCD->nmcd.hdc, pTBCD->nmcd.rc, uID );
					if( IsDropdownCommand( uID ) ){
						DrawDropdownArrow( pTBCD->nmcd.hdc, pTBCD->nmcd.rc, uID );
					}
				}
				return CDRF_DODEFAULT;
			}
		case TTN_GETDISPINFO:
			{
				NMTTDISPINFO* pDispInfo = (NMTTDISPINFO*)pnmh;
				if( pDispInfo->hdr.idFrom >= ID_COMMAND_BASE && pDispInfo->hdr.idFrom < ID_COMMAND_BASE + Cmds().size() ) {
					CCmd& cmd = Cmds()[ pDispInfo->hdr.idFrom - ID_COMMAND_BASE];
					StringCopyN( pDispInfo->szText, _countof( pDispInfo->szText ), cmd.m_sTitle.c_str(), _countof( pDispInfo->szText ) - 1 );
				}
			}
			break;
		case TBN_DROPDOWN:
			{
				NMTOOLBAR* pToolbar = (NMTOOLBAR*)pnmh;
				if( pToolbar->iItem >= ID_COMMAND_BASE && pToolbar->iItem < ID_COMMAND_BASE + (int)Cmds().size() ) {
					// clicked: the button is pressed, so pass the pressed-swap flag
					ShowDropdownMenu( (UINT)pToolbar->iItem, true );
				}
			}
			break;
		}
		return 0;
	}

	void OnTableInitDialog( HWND hDlg )
	{
		CenterWindow( hDlg );
		SetDlgItemInt( hDlg, IDC_ROWS, (UINT)m_wRows, FALSE );
		SetDlgItemInt( hDlg, IDC_COLUMNS, (UINT)m_wColumns, FALSE );
	}

	void OnTableCommand( HWND hDlg, WPARAM wParam )
	{
		if( wParam == IDOK ){
			BOOL bTranslated = FALSE;
			WORD w = (WORD)GetDlgItemInt( hDlg, IDC_ROWS, &bTranslated, FALSE );
			if( bTranslated ){
				m_wRows = w;
			}
			w = (WORD)GetDlgItemInt( hDlg, IDC_COLUMNS, &bTranslated, FALSE );
			if( bTranslated ){
				m_wColumns = w;
			}
			EndDialog( hDlg, IDOK );
		}
		else if( wParam == IDCANCEL ){
			EndDialog( hDlg, IDCANCEL );
		}
	}

	void CustomizeShowHide( HWND hDlg )
	{
		bool bTags = false;
		bool bSpecial = false;
		if( IsDlgButtonChecked( hDlg, IDC_SEPARATOR ) ) {
		}
		else if( IsDlgButtonChecked( hDlg, IDC_TAGS ) ) {
			bTags = true;
		}
		else {
			bSpecial = true;
		}
		EnableWindow( GetDlgItem( hDlg, IDC_TAG_BEGIN ), bTags );
		EnableWindow( GetDlgItem( hDlg, IDC_TAG_END ), bTags );
		EnableWindow( GetDlgItem( hDlg, IDC_BROWSE_BEGIN ), bTags );
		EnableWindow( GetDlgItem( hDlg, IDC_BROWSE_END ), bTags );
		EnableWindow( GetDlgItem( hDlg, IDC_COMBO_SPECIAL ), bSpecial );
	}

	void CustomizeRefreshList( HWND hDlg, int iSel )
	{
		HWND hwndList = GetDlgItem( hDlg, IDC_LIST );
		if( !hwndList )  return;
		ListView_DeleteAllItems( hwndList );
		for( int i = 0; i < (int)Cmds().size(); i++ ) {
			LV_ITEM item;
			ZeroMemory( &item, sizeof(item) );
			item.mask = LVIF_TEXT | LVIF_IMAGE;
			item.iItem = i+1;
			item.pszText = LPSTR_TEXTCALLBACK;
			item.iImage = I_IMAGECALLBACK;
			ListView_InsertItem( hwndList, &item );
		}
		ListView_SetItemState( hwndList, iSel, LVIS_SELECTED | LVIS_FOCUSED, LVIS_SELECTED | LVIS_FOCUSED );
		ListView_EnsureVisible( hwndList, iSel, TRUE );
	}

	void OnCustomizeProp( HWND hDlg )
	{
		HWND hwndList = GetDlgItem( hDlg, IDC_LIST );
		if( !hwndList )  return;
		int iItem = ListView_GetNextItem( hwndList, -1, LVNI_SELECTED );
		if( iItem >= 0 ){
			m_pcmdProp = &Cmds()[ iItem ];
			if( DialogBox( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE( IDD_CUST_PROP ), hDlg, CustPropDlg ) == IDOK ){
				CustomizeRefreshList( hDlg, iItem );
				AddButtons( m_hwndToolbar );
				m_bCmdArrayModified = true;
			}
		}
	}

	void OnCustomizeNew( HWND hDlg )
	{
		HWND hwndList = GetDlgItem( hDlg, IDC_LIST );
		if( !hwndList )  return;
		int iItem = ListView_GetNextItem( hwndList, -1, LVNI_SELECTED );
		CCmd cmd( -1, CMD_SEPARATOR, NULL, NULL, NULL );
		m_pcmdProp = &cmd;
		if( DialogBox( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE( IDD_CUST_PROP ), hDlg, CustPropDlg ) == IDOK ){
			if( iItem >= 0 ){
				Cmds().insert( Cmds().begin() + iItem, cmd );
			}
			else {
				Cmds().push_back( cmd );
			}

			CustomizeRefreshList( hDlg, iItem );
			AddButtons( m_hwndToolbar );
			m_bCmdArrayModified = true;
		}
	}

	void OnCustomizeDelete( HWND hDlg )
	{
		HWND hwndList = GetDlgItem( hDlg, IDC_LIST );
		if( !hwndList )  return;
		int iItem = ListView_GetNextItem( hwndList, -1, LVNI_SELECTED );
		if( iItem >= 0 ){
			Cmds().erase( Cmds().begin() + iItem );
			if( iItem == (int)Cmds().size() ){
				iItem--;
			}
			CustomizeRefreshList( hDlg, iItem );
			AddButtons( m_hwndToolbar );
			m_bCmdArrayModified = true;
		}
	}

	void OnCustomizeCopy( HWND hDlg )
	{
		HWND hwndList = GetDlgItem( hDlg, IDC_LIST );
		if( !hwndList )  return;
		int iItem = ListView_GetNextItem( hwndList, -1, LVNI_SELECTED );

		CCmd cmd = Cmds()[ iItem ];

		m_pcmdProp = &cmd;
		if( DialogBox( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE( IDD_CUST_PROP ), hDlg, CustPropDlg ) == IDOK ){
			if( iItem >= 0 ){
				Cmds().insert( Cmds().begin() + iItem + 1, cmd );
			}
			else {
				Cmds().push_back( cmd );
			}

			CustomizeRefreshList( hDlg, iItem + 1 );
			AddButtons( m_hwndToolbar );
			m_bCmdArrayModified = true;
		}
	}

	void OnCustomizeUpDown( HWND hDlg, int nDir )
	{
		_ASSERT( nDir == 1 || nDir == -1 );
		HWND hwndList = GetDlgItem( hDlg, IDC_LIST );
		if( !hwndList )  return;
		int iItem = ListView_GetNextItem( hwndList, -1, LVNI_SELECTED );

		int iNextItem = iItem + nDir;
		if( iNextItem < 0 || iNextItem >= (int)Cmds().size() ){
			return;
		}
		CCmd cmd = Cmds()[ iItem ];
		Cmds()[ iItem ] = Cmds()[ iNextItem ];
		Cmds()[ iNextItem ] = cmd;
		CustomizeRefreshList( hDlg, iNextItem );
		AddButtons( m_hwndToolbar );
		m_bCmdArrayModified = true;
	}

	void OnCustomizeInitDialog( HWND hDlg )
	{
		CenterWindow( hDlg );
		HWND hwndList = GetDlgItem( hDlg, IDC_LIST );
		if( !hwndList )  return;
		ListView_SetExtendedListViewStyleEx( hwndList, LVS_EX_FULLROWSELECT, LVS_EX_FULLROWSELECT );
		ListView_SetImageList( hwndList, m_himageToolbar, LVSIL_SMALL );

		TCHAR sz[80];
		LV_COLUMN lvC = { 0 };
		lvC.mask = LVCF_FMT | LVCF_WIDTH | LVCF_TEXT | LVCF_SUBITEM;
		lvC.pszText = sz;
		RECT rc;
		GetWindowRect( hwndList, &rc );
		lvC.cx = rc.right - rc.left - GetSystemMetrics( SM_CXVSCROLL ) - GetSystemMetrics( SM_CXEDGE ) * 2;
//		LoadString( EEGetInstanceHandle(), IDS_VALUE, sz, _countof( sz ) );
		GetWindowText( hDlg, sz, _countof( sz ) );
		VERIFY( ListView_InsertColumn( hwndList, 0, &lvC ) != -1 );

		CustomizeRefreshList( hDlg, 0 );

	}

	void OnCustomizeCommand( HWND hDlg, WPARAM wParam )
	{
		if( wParam == IDCANCEL ){
			EndDialog( hDlg, IDCANCEL );
			SaveCmdArray();
		}
		else if( wParam == IDC_PROP ){
			OnCustomizeProp( hDlg );
		}
		else if( wParam == IDC_NEW ){
			OnCustomizeNew( hDlg );
		}
		else if( wParam == IDC_COPY ){
			OnCustomizeCopy( hDlg );
		}
		else if( wParam == IDC_DELETE ){
			OnCustomizeDelete( hDlg );
		}
		else if( wParam == IDC_UP ){
			OnCustomizeUpDown( hDlg, -1 );
		}
		else if( wParam == IDC_DOWN ){
			OnCustomizeUpDown( hDlg, 1 );
		}
		else if( wParam == IDC_RESET ){
			TCHAR sz[260], szAppName[80];
			LoadString( EEGetLocaleInstanceHandle(), IDS_SURE_RESET, sz, _countof( sz ) );
			LoadString( EEGetLocaleInstanceHandle(), IDS_MENU_TEXT, szAppName, sizeof( szAppName ) / sizeof( TCHAR ) );
			if( MessageBox( hDlg, sz, szAppName, MB_YESNO | MB_ICONEXCLAMATION ) == IDYES ){
				ResetCmdArray( m_iMode );
				CustomizeRefreshList( hDlg, 0 );
				AddButtons( m_hwndToolbar );
			}
		}
	}

	BOOL OnCustomizeNotify( HWND hDlg, int idCtrl, LPNMHDR pnmh )
	{
		BOOL bResult = FALSE;
		if( idCtrl == IDC_LIST ){
			switch( pnmh->code ){
			case LVN_GETDISPINFO:
				{
					LV_DISPINFO* pDispInfo = (LV_DISPINFO*)pnmh;
					if( pDispInfo->item.iItem < (int)Cmds().size() ) {
						_ASSERT( pDispInfo->item.iItem >= 0 && pDispInfo->item.iItem < (int)Cmds().size() );
						CCmd& cmd = Cmds()[pDispInfo->item.iItem];
						if( pDispInfo->item.mask & LVIF_TEXT ){
							if( cmd.m_iCmd == CMD_SEPARATOR ){
								StringCopy( pDispInfo->item.pszText, pDispInfo->item.cchTextMax, L"----------" );
							}
							else {
								StringCopyN( pDispInfo->item.pszText, pDispInfo->item.cchTextMax, cmd.m_sTitle.c_str(), pDispInfo->item.cchTextMax-1 );
							}
						}
						if( pDispInfo->item.mask & LVIF_IMAGE ){
							if( cmd.m_iCmd == CMD_SEPARATOR ){
								pDispInfo->item.iImage = -1;
							}
							else {
								pDispInfo->item.iImage = cmd.m_iIcon;
							}
						}	
					}
				}
				break;
			case NM_DBLCLK:
				{
					OnCustomizeProp( hDlg );
				}
				break;
			}
		}
		return bResult;
	}

	void OnCustPropInitDialog( HWND hDlg )
	{
		CenterWindow( hDlg );
		m_bPropInitialized = false;
		SendDlgItemMessage( hDlg, IDC_TITLE, EM_LIMITTEXT, MAX_BUTTON_TITLE - 1, 0 );
		SendDlgItemMessage( hDlg, IDC_TAG_BEGIN, EM_LIMITTEXT, MAX_TAG_FIELD - 1, 0 );
		SendDlgItemMessage( hDlg, IDC_TAG_END, EM_LIMITTEXT, MAX_TAG_FIELD - 1, 0 );
		SetDlgItemText( hDlg, IDC_TITLE, m_pcmdProp->m_sTitle.c_str() );

		HWND hwndComboSpecial = GetDlgItem( hDlg, IDC_COMBO_SPECIAL );
		if( !hwndComboSpecial )  return;
		for( int i = 0; i < (int)_countof( SpecialStringID ); i++ ) {
			COMBOBOXEXITEM item = { 0 };
			item.mask = CBEIF_TEXT;
			item.iItem = -1;
			item.pszText = LPSTR_TEXTCALLBACK;
			SendMessage( hwndComboSpecial, CBEM_INSERTITEM, 0, (LPARAM)&item );
		}

		HWND hwndCombo = GetDlgItem( hDlg, IDC_COMBO_ICON );
		if( !hwndCombo )  return;
	    SendMessage( hwndCombo, CBEM_SETIMAGELIST, 0, (LPARAM)m_himageToolbar );
		// enumerate light icons only; the tail of the list holds the
		// pressed-state dark copies, and the last two light images are the
		// [H][M] mode-switch glyphs — neither is user-assignable
		int nCount = ( m_nLightIcons > 0 ) ? m_nLightIcons : ImageList_GetImageCount( m_himageToolbar );
		nCount -= 2;
		if( nCount < 0 )  nCount = 0;
		for( int i = -1; i < nCount; i++ ) {
			COMBOBOXEXITEM item = { 0 };
			item.mask = CBEIF_IMAGE | CBEIF_SELECTEDIMAGE | CBEIF_TEXT;
			item.iItem = -1;
			item.iImage = i;
			item.iSelectedImage = i;
			item.pszText = LPSTR_TEXTCALLBACK;
			SendMessage( hwndCombo, CBEM_INSERTITEM, 0, (LPARAM)&item );
		}

		SendMessage( hwndCombo, CB_SETCURSEL, m_pcmdProp->m_iCmd == CMD_SEPARATOR ? 0 : m_pcmdProp->m_iIcon + 1, 0 );

		SendMessage( hwndComboSpecial, CB_SETCURSEL, max( 0, (m_pcmdProp->m_iCmd - CMD_INSERT_TABLE) ), 0 );

		int nID;
		if( m_pcmdProp->m_iCmd == CMD_SEPARATOR ){
			nID = IDC_SEPARATOR;
			m_bPropModified = false;
		}
		else if( m_pcmdProp->m_iCmd == CMD_TAGS ){
			nID = IDC_TAGS;
			m_bPropModified = true;
		}
		else {
			nID = IDC_SPECIAL;
			m_bPropModified = true;
		}
		VERIFY( CheckRadioButton( hDlg, IDC_TAGS, IDC_SEPARATOR, nID ) );

		SetDlgItemText( hDlg, IDC_TAG_BEGIN, m_pcmdProp->m_sTagBegin.c_str() );
		SetDlgItemText( hDlg, IDC_TAG_END, m_pcmdProp->m_sTagEnd.c_str() );

		CustomizeShowHide( hDlg );
		m_bPropInitialized = true;

	}

	void OnCustPropCommand( HWND hDlg, WPARAM wParam )
	{
		if( wParam == IDOK ){
			TCHAR sz[MAX_BUTTON_TITLE];
			GetDlgItemText( hDlg, IDC_TITLE, sz, _countof( sz ) );
			m_pcmdProp->m_sTitle = sz;

			if( IsDlgButtonChecked( hDlg, IDC_SEPARATOR ) ) {
				m_pcmdProp->m_iIcon = -1;
				m_pcmdProp->m_iCmd = CMD_SEPARATOR;
			}
			else if( IsDlgButtonChecked( hDlg, IDC_TAGS ) ) {
				m_pcmdProp->m_iCmd = CMD_TAGS;
				GetDlgItemText( hDlg, IDC_TAG_BEGIN, sz, _countof( sz ) );
				m_pcmdProp->m_sTagBegin = sz;
				GetDlgItemText( hDlg, IDC_TAG_END, sz, _countof( sz ) );
				m_pcmdProp->m_sTagEnd = sz;
			}
			else if( m_pcmdProp->m_iCmd == CMD_ICON_COLOR || m_pcmdProp->m_iCmd == CMD_MD_VIEW || m_pcmdProp->m_iCmd == CMD_PREVIEW ){
				// functional buttons, not editable special commands:
				// keep their code and apply only the title/icon changes
				;	// m_iCmd unchanged
			}
			else {
				int iSpecial = (int)SendDlgItemMessage( hDlg, IDC_COMBO_SPECIAL, CB_GETCURSEL, 0, 0 );
				_ASSERT( iSpecial >= 0 && iSpecial < MAX_CMD - CMD_INSERT_TABLE );
				m_pcmdProp->m_iCmd = iSpecial + CMD_INSERT_TABLE;
			}

			if( m_pcmdProp->m_iCmd != CMD_SEPARATOR ){
				m_pcmdProp->m_iIcon = (int)SendDlgItemMessage( hDlg, IDC_COMBO_ICON, CB_GETCURSEL, 0, 0 ) - 1;
			}

			EndDialog( hDlg, IDOK );
		}
		else if( wParam == IDCANCEL ){
			EndDialog( hDlg, IDCANCEL );
		}
		else if( wParam == IDC_SEPARATOR || wParam == IDC_TAGS || wParam == IDC_SPECIAL ){
			if( wParam == IDC_SEPARATOR ){
				SendDlgItemMessage( hDlg, IDC_COMBO_ICON, CB_SETCURSEL, 0, 0 );
			}
			CustomizeShowHide( hDlg );
			m_bPropModified = true;
		}
		else if( wParam == MAKEWPARAM( IDC_COMBO_ICON, CBN_SELENDOK ) ){
			int iIcon = (int)SendDlgItemMessage( hDlg, IDC_COMBO_ICON, CB_GETCURSEL, 0, 0 );
			if( iIcon == 0 ){
				VERIFY( CheckRadioButton( hDlg, IDC_TAGS, IDC_SEPARATOR, IDC_SEPARATOR ) );
				SetDlgItemText( hDlg, IDC_TAG_BEGIN, L"" );
				SetDlgItemText( hDlg, IDC_TAG_END, L"" );
			}
			else if( !m_bPropModified ){
				TCHAR sz[MAX_BUTTON_TITLE];
				LoadString( EEGetLocaleInstanceHandle(), ID_HEADER + iIcon - 1, sz, _countof( sz ) );
				SetDlgItemText( hDlg, IDC_TITLE, sz );
				for( int i = 0; i < _countof( DefCmd ); i++ ){
					if( DefCmd[i].m_iIcon == iIcon - 1 ){
						int nID = IDC_TAGS;
						if( DefCmd[i].m_iCmd != CMD_TAGS ){
							nID = IDC_SPECIAL;
							int iSpecial = DefCmd[i].m_iCmd - CMD_INSERT_TABLE;
							SendDlgItemMessage( hDlg, IDC_COMBO_SPECIAL, CB_SETCURSEL, iSpecial, 0 );
						}
						VERIFY( CheckRadioButton( hDlg, IDC_TAGS, IDC_SEPARATOR, nID ) );
						SetDlgItemText( hDlg, IDC_TAG_BEGIN, DefCmd[i].m_pszTagBegin );
						SetDlgItemText( hDlg, IDC_TAG_END, DefCmd[i].m_pszTagEnd );
						CustomizeShowHide( hDlg );
						break;
					}
				}
			}
		}
		else if( wParam == MAKEWPARAM( IDC_COMBO_SPECIAL, CBN_SELENDOK ) ){
			m_bPropModified = true;
		}
		else if( wParam == MAKEWPARAM( IDC_TAG_BEGIN, EN_CHANGE ) || wParam == MAKEWPARAM( IDC_TAG_END, EN_CHANGE )
			|| wParam == MAKEWPARAM( IDC_TITLE, EN_CHANGE ) ){
//			if( m_bPropInitialized ){
			if( GetFocus() == GetDlgItem( hDlg, LOWORD( wParam ) ) ) {
				m_bPropModified = true;
			}
		}
		else if( wParam == IDC_BROWSE_BEGIN || wParam == IDC_BROWSE_END ){
			HWND hwndButton = (HWND)GetDlgItem( hDlg, (int)wParam );
			RECT rect;
			GetWindowRect( hwndButton, &rect );
			BOOL bRightAlign = GetSystemMetrics( SM_MENUDROPALIGNMENT );
			HMENU hMenu = LoadMenu( EEGetLocaleInstanceHandle(), MAKEINTRESOURCE( IDR_ARG_POPUP ) );
			HMENU hSubMenu = GetSubMenu( hMenu, 0 );
			UINT uID = TrackPopupMenu( hSubMenu, (bRightAlign ? TPM_RIGHTALIGN : TPM_LEFTALIGN) | TPM_RIGHTBUTTON | TPM_NONOTIFY | TPM_RETURNCMD, bRightAlign ? rect.right : rect.left, rect.bottom, 0, hDlg, NULL );
			DestroyMenu( hMenu );
			if( uID != 0 ){
				TCHAR sz[80];
				StringPrintf( sz, _countof( sz ), _T("\\{%s}"), szToolArgs[uID-1] );
				SendDlgItemMessage( hDlg, wParam == IDC_BROWSE_BEGIN ? IDC_TAG_BEGIN : IDC_TAG_END, EM_REPLACESEL, TRUE, (LPARAM)sz );
			}
		}
	}

	BOOL OnCustPropNotify( HWND /* hDlg */, int idCtrl, LPNMHDR pnmh )
	{
		BOOL bResult = FALSE;
		if( idCtrl == IDC_COMBO_ICON ){
			switch( pnmh->code ){
			case CBEN_GETDISPINFO:
				{
					NMCOMBOBOXEX* pComboBoxEx = (NMCOMBOBOXEX*)pnmh;
					COMBOBOXEXITEM& item = pComboBoxEx->ceItem;
					_ASSERT( item.iItem >= 0 && item.iItem < (int)ImageList_GetImageCount( m_himageToolbar ) + 1 );
					if( item.mask & CBEIF_TEXT ){
						if( item.iItem == 0 ){
							StringCopy( item.pszText, item.cchTextMax, L"----------" );
						}
						else {
							// label each icon slot with the title of the
							// command that uses it in the CURRENT mode: the
							// old fixed ID_HEADER+slot mapping silently
							// assumed HTML slots and mislabeled every icon
							// in Markdown mode
							const int iSlot = item.iItem - 1;
							bool bFound = false;
							for( const auto& cmd : Cmds() ){
								if( cmd.m_iCmd != CMD_SEPARATOR && cmd.m_iIcon == iSlot && !cmd.m_sTitle.empty() ){
									StringCopyN( item.pszText, item.cchTextMax, cmd.m_sTitle.c_str(), item.cchTextMax - 1 );
									bFound = true;
									break;
								}
							}
							if( !bFound ){
								// unassigned HTML slot: keep the default
								// command name for that slot when defined
								item.pszText[0] = 0;
								LoadString( EEGetLocaleInstanceHandle(), ID_HEADER + iSlot, item.pszText, item.cchTextMax );
							}
						}
					}
				}
				break;
			}
		}
		else if( idCtrl == IDC_COMBO_SPECIAL ){
			switch( pnmh->code ){
			case CBEN_GETDISPINFO:
				{
					NMCOMBOBOXEX* pComboBoxEx = (NMCOMBOBOXEX*)pnmh;
					COMBOBOXEXITEM& item = pComboBoxEx->ceItem;
					_ASSERT( item.iItem >= 0 && item.iItem < _countof( SpecialStringID ) );
					if( item.mask & CBEIF_TEXT ){
						int nID = SpecialStringID[ item.iItem ];
						LoadString( EEGetLocaleInstanceHandle(), nID, item.pszText, item.cchTextMax );
					}	
				}
				break;
			}
		}
		return bResult;
	}


};

LRESULT CALLBACK ToolbarProc( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam )
{
	CMyFrame* pFrame = (CMyFrame*)GetWindowLongPtr( hwnd, GWLP_USERDATA );
	if( pFrame && pFrame->OnToolbarMessage( hwnd, msg, wParam, lParam ) ){
		return 0;	// swallowed: e.g. WM_MOUSELEAVE while our menu tracks
	}
	WNDPROC wpOld = pFrame ? pFrame->m_wpOldToolbarProc : NULL;
	return wpOld ? CallWindowProc( wpOld, hwnd, msg, wParam, lParam )
	             : DefWindowProc( hwnd, msg, wParam, lParam );
}


INT_PTR CALLBACK NewProc( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam )
{
	LRESULT nResult = 0;
	switch( msg ){
	case WM_CTLCOLORDLG:
	case WM_CTLCOLORSTATIC:
	case WM_CTLCOLORBTN:
		{
			// official Very Dark adaptation: return EmEditor's dark brush
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			HBRUSH hbr = pFrame ? pFrame->GetVeryDarkBrush( hwnd, (HDC)wParam ) : NULL;
			if( hbr ){
				return (INT_PTR)hbr;
			}
		}
		break;

	case WM_THEMECHANGED:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			if( pFrame ){
				pFrame->OnThemeChanged( hwnd );
			}
		}
		break;

	case WM_COMMAND:
		{
			TRACE( _T("WM_COMMAND: wParam = %x, lParam = %x.\n"), wParam, lParam );
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			pFrame->OnDlgCommand( wParam );
		}
		break;

	case WM_NOTIFY:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			// this window is a dialog: notification results (the CDRF_*
			// replies NM_CUSTOMDRAW depends on) go back via DWLP_MSGRESULT,
			// the dialog proc's own return value is ignored for them
			SetWindowLongPtr( hwnd, DWLP_MSGRESULT, pFrame->OnDlgNotify( (NMHDR*)lParam ) );
			nResult = TRUE;
		}
		break;
	case WM_TIMER:
		if( wParam == IDT_HOVER_MENU ){
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			if( pFrame ){
				pFrame->OnHoverMenuTimer();
			}
			return 0;
		}
			else if( wParam == IDT_STARTUP_RESTORE ){
				KillTimer( hwnd, IDT_STARTUP_RESTORE );
				CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
				if( pFrame ){
					pFrame->OnStartupRestore();
				}
				return 0;
			}
			else if( wParam == IDT_DESIGN_SYNC ){
				KillTimer( hwnd, IDT_DESIGN_SYNC );
				CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
				if( pFrame ){
					pFrame->OnDesignSyncTimer();
				}
				return 0;
			}
			else if( wParam == IDT_PREVIEW_REFRESH ){
				KillTimer( hwnd, IDT_PREVIEW_REFRESH );
				// live sync suspended: the in-process WebView2 is unusable
				// (browser process never spawns — reported upstream material)
				return 0;
			}
		break;

	}
	return (BOOL)nResult;
}


INT_PTR CALLBACK TableDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM /*lParam*/ )
{
	LRESULT nResult = 0;
	switch( msg ){
	case WM_INITDIALOG:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			if( pFrame ){
				pFrame->OnTableInitDialog( hwnd );
			}
		}
		break;

	case WM_COMMAND:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			pFrame->OnTableCommand( hwnd, wParam );
		}
		break;
	}
	return (BOOL)nResult;
}

INT_PTR CALLBACK PropDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM /*lParam*/ )
{
	LRESULT nResult = 0;
	switch( msg ){
	case WM_INITDIALOG:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			if( pFrame ){
				pFrame->OnPropInitDialog( hwnd );
			}
		}
		break;

	case WM_COMMAND:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			pFrame->OnPropCommand( hwnd, wParam );
		}
		break;
	}
	return (BOOL)nResult;
}


INT_PTR CALLBACK InputParamsDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam )
{
	BOOL bResult = FALSE;
	switch( msg ){
	case WM_INITDIALOG:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrameFromDlg( hwnd ));
			_ASSERTE( pFrame );
			bResult = pFrame->OnInputInitDialog( hwnd );
		}
		break;
	case WM_COMMAND:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrameFromDlg( hwnd ));
			_ASSERTE( pFrame );
			pFrame->OnInputDlgCommand( hwnd, wParam );
		}
		break;
	case WM_NOTIFY:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrameFromDlg( hwnd ));
			_ASSERTE( pFrame );
			bResult = pFrame->OnInputDlgNotify( hwnd, (int)wParam, (LPNMHDR)lParam );
		}
		break;
	}
	return bResult;
}

LRESULT CALLBACK EditProc( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam )
{
	switch( msg ){

	case WM_KEYDOWN:
		{
			CMyFrame* pFrame = (CMyFrame*)GetFrameFromDlg( hwnd );
			if( pFrame != NULL ){
				pFrame->OnEditKeyDown( hwnd, wParam, lParam );
			}
		}
		break;
	}

	HWND hwndFrame = GetAncestor( hwnd, GA_ROOTOWNER );
	if( IsWindow( hwndFrame ) ){
		CMyFrame* pFrame = (CMyFrame*)GetFrameFromFrame( hwndFrame );
//	CMyFrame* pFrame = (CMyFrame*)GetFrameFromDlg( hwnd );
		if( pFrame != NULL && pFrame->m_lpOldEditProc != NULL ){
			return CallWindowProc( pFrame->m_lpOldEditProc, hwnd, msg, wParam, lParam);
		}
	}
	return 0;
}

INT_PTR CALLBACK CustomizeDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam )
{
	LRESULT nResult = 0;
	switch( msg ){
	case WM_INITDIALOG:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			if( pFrame ){
				pFrame->OnCustomizeInitDialog( hwnd );
			}
		}
		break;

	case WM_COMMAND:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			pFrame->OnCustomizeCommand( hwnd, wParam );
		}
		break;

	case WM_NOTIFY:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			_ASSERTE( pFrame );
			nResult = pFrame->OnCustomizeNotify( hwnd, (int)wParam, (LPNMHDR)lParam );
		}
		break;
	}
	return (BOOL)nResult;
}


INT_PTR CALLBACK CustPropDlg( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam )
{
	LRESULT nResult = 0;
	switch( msg ){
	case WM_INITDIALOG:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			if( pFrame ){
				pFrame->OnCustPropInitDialog( hwnd );
			}
		}
		break;

	case WM_COMMAND:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			pFrame->OnCustPropCommand( hwnd, wParam );
		}
		break;

	case WM_NOTIFY:
		{
			CMyFrame* pFrame = static_cast<CMyFrame*>(GetFrame( hwnd ));
			_ASSERTE( pFrame );
			nResult = pFrame->OnCustPropNotify( hwnd, (int)wParam, (LPNMHDR)lParam );

		}
		break;
	}
	return (BOOL)nResult;
}


// the following line is needed after CMyFrame definition
_ETL_IMPLEMENT

