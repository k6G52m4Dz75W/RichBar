// implementatin of this specific plug-in is here:
//

#define MAX_BUTTON_TITLE	260
#define MAX_TAG_FIELD		260
#define BUTTON_SIZE_SMALL   22
#define BUTTON_SIZE_LARGE   30
#define SIGNATURE_CMD_ARRAY 0x00FE0100

#define MAX_RECENT_FONT		8
#define ID_COMMAND_BASE		100

#define ZERO_INIT_FIRST_MEM(classname, firstmem)  ZeroMemory( &firstmem, sizeof( classname ) - ((char*)&firstmem - (char*)this) );

INT_PTR CALLBACK NewProc( HWND hwnd, UINT msg, WPARAM wParam, LPARAM lParam );
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
#define MAX_CMD					9

// toolbar mode-switch buttons (command IDs below ID_COMMAND_BASE)
#define ID_MODE_HTML			90
#define ID_MODE_MD				91
// runtime-drawn glyphs appended to every toolbar image list
#define MD_ICON_MODE_H			20
#define MD_ICON_MODE_M			21

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
		int nIcons = 0;
		if( m_himageToolbar ){
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
			if( it->m_iCmd == CMD_FONT ){
				atb[i + 3].fsStyle = BTNS_DROPDOWN;
			}
			if( it->m_iCmd == CMD_DROPDOWN_HEADER || it->m_iCmd == CMD_DROPDOWN_FORM ){
				atb[i + 3].fsStyle = BTNS_WHOLEDROPDOWN;
			}

		}

		SendMessage( hwndToolbar, TB_ADDBUTTONSA, (WPARAM)( nCmd + 3 ), (LPARAM)atb );
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

	HBITMAP CreateMdIconBitmap( int cx, void** ppvBits )
	{
		BITMAPINFO bmi;
		ZeroMemory( &bmi, sizeof( bmi ) );
		bmi.bmiHeader.biSize = sizeof( BITMAPINFOHEADER );
		bmi.bmiHeader.biWidth = cx;
		bmi.bmiHeader.biHeight = -cx;	// top-down
		bmi.bmiHeader.biPlanes = 1;
		bmi.bmiHeader.biBitCount = 32;
		bmi.bmiHeader.biCompression = BI_RGB;
		void* pvBits = NULL;
		HBITMAP hbm = CreateDIBSection( NULL, &bmi, DIB_RGB_COLORS, &pvBits, NULL, 0 );
		if( hbm && pvBits ){
			// fill with the transparency key color; converted to alpha 0 after drawing
			for( int i = 0; i < cx * cx; i++ ){
				( (DWORD*)pvBits )[i] = 0x00FF00FF;	// magenta key, alpha 0
			}
		}
		*ppvBits = pvBits;
		return hbm;
	}

	void MdKeyOutBackground( int cx, void* pvBits )
	{
		if( !pvBits )  return;
		for( int i = 0; i < cx * cx; i++ ){
			DWORD dw = ( (DWORD*)pvBits )[i];
			if( ( dw & 0x00FFFFFF ) == 0x00FF00FF ){
				( (DWORD*)pvBits )[i] = 0x00000000;	// transparent
			}
			else {
				( (DWORD*)pvBits )[i] = dw | 0xFF000000;	// opaque
			}
		}
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

	void DrawMdHeading( HDC hdc, int cx, int nLevel, COLORREF crFg )
	{
		HFONT fonts[2] = {
			CreateFontW( -MulDiv( MD_TEXT_HEIGHT, cx, 16 ), 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
				DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, ANTIALIASED_QUALITY, FF_DONTCARE, L"Segoe UI" ),
			CreateFontW( -MulDiv( MD_SUBSCRIPT_HEIGHT, cx, 16 ), 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
				DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, ANTIALIASED_QUALITY, FF_DONTCARE, L"Segoe UI" )
		};
		WCHAR chars[2] = { L'H', (WCHAR)( L'0' + nLevel ) };
		GLYPHMETRICS metrics[2] = {};
		MAT2 transform = {};
		transform.eM11.value = transform.eM22.value = 1;
		BOOL measured = fonts[0] && fonts[1];
		for( int i = 0; i < 2 && measured; i++ ){
			HFONT old = (HFONT)SelectObject( hdc, fonts[i] );
			measured = GetGlyphOutlineW( hdc, chars[i], GGO_METRICS, &metrics[i], 0, NULL, &transform ) != GDI_ERROR;
			SelectObject( hdc, old );
		}
		if( measured ){
			int gap = max( 1, MulDiv( 1, cx, 16 ) );
			int drop = MulDiv( 2, cx, 16 );
			int width = metrics[0].gmBlackBoxX + gap + metrics[1].gmBlackBoxX;
			int height = metrics[0].gmBlackBoxY + drop;
			int x = ( cx - width ) / 2;
			int y = ( cx - height ) / 2;
			UINT oldAlign = SetTextAlign( hdc, TA_LEFT | TA_BASELINE | TA_NOUPDATECP );
			SetBkMode( hdc, TRANSPARENT );
			SetTextColor( hdc, crFg );
			// Center the combined ink bounds, not the fonts' different line boxes.
			for( int i = 0; i < 2; i++ ){
				HFONT old = (HFONT)SelectObject( hdc, fonts[i] );
				int top = i ? y + height - metrics[i].gmBlackBoxY : y;
				TextOutW( hdc, x - metrics[i].gmptGlyphOrigin.x, top + metrics[i].gmptGlyphOrigin.y, &chars[i], 1 );
				SelectObject( hdc, old );
				x += metrics[i].gmBlackBoxX + gap;
			}
			SetTextAlign( hdc, oldAlign );
		}
		else {
			WCHAR text[] = { chars[0], chars[1], 0 };
			DrawMdText( hdc, cx, text, MD_CODE_HEIGHT, FW_BOLD, FALSE, crFg );
		}
		for( int i = 0; i < 2; i++ ){
			if( fonts[i] ) DeleteObject( fonts[i] );
		}
	}

	void DrawMdIcon( HDC hdc, int cx, int iIcon, COLORREF crFg )
	{
		HPEN hpen = CreatePen( PS_SOLID, max( 1, cx / 16 ), crFg );
		HPEN hpenOld = (HPEN)SelectObject( hdc, hpen );
		HBRUSH hbrOld = (HBRUSH)SelectObject( hdc, GetStockObject( NULL_BRUSH ) );

		// Prefer the system icon font for the pictogram icons (Segoe Fluent
		// Icons on Win11, Segoe MDL2 Assets on Win10; zero distribution cost).
		// Each glyph is availability-checked once; icons without a font glyph
		// fall through to the legacy letter/shape drawing below.
		struct IconGlyph { int iIcon; wchar_t wch; };
		static const IconGlyph c_aIconGlyphs[] = {
			// only glyphs verified against the official Fluent/MDL2 lists
			// (learn.microsoft.com); icons without an official glyph keep the
			// letter/shape drawing below (table/numbered list have none)
			{ 6, 0xE8DD },		// bold
			{ 7, 0xE8DB },		// italic
			{ 8, 0xEDE0 },		// strikethrough
			{ 9, 0xE943 },		// inline code
			{ 11, 0xE848 },		// quote
			{ 12, 0xE8FD },		// bullet list
			{ 14, 0xE9D5 },		// task list
			{ 16, 0xE71B },		// link
			{ 17, 0xE8B9 },		// image
			{ 18, 0xF232 },		// table (GridViewSmall; not in MDL2 -> shape fallback on Win10)
			{ 19, 0xE713 },		// customize (gear)
		};
		static int s_iFont = 0;			// 0 none, 1 Fluent, 2 MDL2
		static bool s_abGlyph[_countof( c_aIconGlyphs )] = { false };
		static bool s_bFontChecked = false;
		if( !s_bFontChecked ){
			s_bFontChecked = true;
			HDC hdcProbe = CreateCompatibleDC( NULL );
			LPCWSTR apszFaces[] = { L"Segoe Fluent Icons", L"Segoe MDL2 Assets" };
			for( int f = 0; f < 2 && s_iFont == 0; f++ ){
				HFONT hfontProbe = CreateFontW( -16, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
					DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, DEFAULT_QUALITY, FF_DONTCARE, apszFaces[f] );
				if( !hfontProbe ){
					continue;
				}
				HFONT hfontProbeOld = (HFONT)SelectObject( hdcProbe, hfontProbe );
				BOOL bAny = FALSE;
				for( int g = 0; g < (int)_countof( c_aIconGlyphs ); g++ ){
					WCHAR wChar = (WCHAR)c_aIconGlyphs[g].wch;
					WORD wIndex = 0xFFFF;
					if( GetGlyphIndicesW( hdcProbe, &wChar, 1, &wIndex, GGI_MARK_NONEXISTING_GLYPHS ) != GDI_ERROR && wIndex != 0xFFFF ){
						s_abGlyph[g] = true;
						bAny = TRUE;
					}
				}
				SelectObject( hdcProbe, hfontProbeOld );
				DeleteObject( hfontProbe );
				if( bAny ){
					s_iFont = f + 1;
				}
			}
			DeleteDC( hdcProbe );
		}
		BOOL bGlyphDrawn = FALSE;
		if( s_iFont != 0 ){
			for( int g = 0; g < (int)_countof( c_aIconGlyphs ); g++ ){
				if( c_aIconGlyphs[g].iIcon != iIcon || !s_abGlyph[g] ){
					continue;
				}
				HFONT hfontIcon = CreateFontW( -cx, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
					DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS, ANTIALIASED_QUALITY, FF_DONTCARE,
					( s_iFont == 1 ) ? L"Segoe Fluent Icons" : L"Segoe MDL2 Assets" );
				HFONT hfontIconOld = (HFONT)SelectObject( hdc, hfontIcon );
				SetBkMode( hdc, TRANSPARENT );
				SetTextColor( hdc, crFg );
				RECT rcGlyph = { 0, 0, cx, cx };
				DrawTextW( hdc, &c_aIconGlyphs[g].wch, 1, &rcGlyph, DT_CENTER | DT_VCENTER | DT_SINGLELINE );
				SelectObject( hdc, hfontIconOld );
				DeleteObject( hfontIcon );
				bGlyphDrawn = TRUE;
				break;
			}
		}
		if( !bGlyphDrawn ){
		switch( iIcon ){
		int y1, y2;
		case 0: case 1: case 2: case 3: case 4: case 5:		// H1 - H6
			DrawMdHeading( hdc, cx, iIcon + 1, crFg );
			break;
		case 6:		// bold
			DrawMdText( hdc, cx, L"B", MD_TEXT_HEIGHT, FW_BOLD, FALSE, crFg );
			break;
		case 7:		// italic
			DrawMdText( hdc, cx, L"I", MD_TEXT_HEIGHT, FW_NORMAL, TRUE, crFg );
			break;
		case 8:		// strikethrough
			DrawMdText( hdc, cx, L"S", MD_TEXT_HEIGHT, FW_BOLD, FALSE, crFg );
			MoveToEx( hdc, cx * 22 / 100, cx / 2, NULL );
			LineTo( hdc, cx * 78 / 100, cx / 2 );
			break;
		case 9:		// inline code
			DrawMdText( hdc, cx, L"</>", 10, FW_NORMAL, FALSE, crFg );
			break;
		case 10:	// code block
			DrawMdText( hdc, cx, L"{ }", MD_CODE_HEIGHT, FW_BOLD, FALSE, crFg );
			break;
		case 11:	// quote
			DrawMdText( hdc, cx, L"\x275D", MD_TEXT_HEIGHT, FW_NORMAL, FALSE, crFg );
			break;
		case 12:	// bullet list
		case 13:	// numbered list
		case 14:	// task list
			y1 = cx * 28 / 100;
			y2 = cx * 22 / 100;
			for( int r = 0; r < 3; r++ ){
				int y = y1 + r * y2;
				MoveToEx( hdc, cx * 38 / 100, y, NULL );
				LineTo( hdc, cx * 84 / 100, y );
			}
			if( iIcon == 12 ){
				HBRUSH hbr = CreateSolidBrush( crFg );
				HBRUSH hbrOld2 = (HBRUSH)SelectObject( hdc, hbr );
				for( int r = 0; r < 3; r++ ){
					int y = y1 + r * y2;
					Ellipse( hdc, cx * 12 / 100 - cx / 14, y - cx / 14, cx * 12 / 100 + cx / 14, y + cx / 14 );
				}
				SelectObject( hdc, hbrOld2 );
				DeleteObject( hbr );
			}
			else if( iIcon == 13 ){
				for( int r = 0; r < 3; r++ ){
					WCHAR szDigit[2];
					StringPrintf( szDigit, _countof( szDigit ), L"%d", r + 1 );
					DrawMdTextAt( hdc, cx * 8 / 100, y1 + r * y2 - cx * 15 / 100, szDigit, MulDiv( 6, cx, 16 ), FW_NORMAL, crFg );
				}
			}
			else {
				for( int r = 0; r < 3; r++ ){
					int y = y1 + r * y2;
					Rectangle( hdc, cx * 8 / 100, y - cx * 9 / 100, cx * 8 / 100 + cx * 18 / 100, y + cx * 9 / 100 );
				}
			}
			break;
		case 15:	// horizontal line
			MoveToEx( hdc, cx * 12 / 100, cx / 2, NULL );
			LineTo( hdc, cx * 88 / 100, cx / 2 );
			break;
		case 16:	// link
			RoundRect( hdc, cx * 8 / 100, cx * 42 / 100, cx * 52 / 100, cx * 70 / 100, cx * 20 / 100, cx * 20 / 100 );
			RoundRect( hdc, cx * 48 / 100, cx * 30 / 100, cx * 92 / 100, cx * 58 / 100, cx * 20 / 100, cx * 20 / 100 );
			break;
		case 17:	// image
			Rectangle( hdc, cx * 10 / 100, cx * 20 / 100, cx * 90 / 100, cx * 80 / 100 );
			{
				HBRUSH hbr = CreateSolidBrush( crFg );
				HBRUSH hbrOld2 = (HBRUSH)SelectObject( hdc, hbr );
				POINT aptSun[4] = {
					{ cx * 34 / 100, cx * 30 / 100 }, { cx * 42 / 100, cx * 38 / 100 },
					{ cx * 34 / 100, cx * 46 / 100 }, { cx * 26 / 100, cx * 38 / 100 } };
				Polygon( hdc, aptSun, 4 );
				POINT aptMountain[3] = {
					{ cx * 16 / 100, cx * 72 / 100 }, { cx * 42 / 100, cx * 42 / 100 },
					{ cx * 62 / 100, cx * 72 / 100 } };
				Polygon( hdc, aptMountain, 3 );
				POINT aptMountain2[4] = {
					{ cx * 50 / 100, cx * 72 / 100 }, { cx * 66 / 100, cx * 52 / 100 },
					{ cx * 84 / 100, cx * 72 / 100 }, { cx * 50 / 100, cx * 72 / 100 } };
				Polygon( hdc, aptMountain2, 4 );
				SelectObject( hdc, hbrOld2 );
				DeleteObject( hbr );
			}
			break;
		case 18:	// table
			Rectangle( hdc, cx * 10 / 100, cx * 22 / 100, cx * 90 / 100, cx * 78 / 100 );
			MoveToEx( hdc, cx * 10 / 100, cx / 2, NULL );
			LineTo( hdc, cx * 90 / 100, cx / 2 );
			MoveToEx( hdc, cx * 37 / 100, cx * 22 / 100, NULL );
			LineTo( hdc, cx * 37 / 100, cx * 78 / 100 );
			MoveToEx( hdc, cx * 63 / 100, cx * 22 / 100, NULL );
			LineTo( hdc, cx * 63 / 100, cx * 78 / 100 );
			break;
		case 19:	// customize (gear)
			DrawMdText( hdc, cx, L"\x2699", MD_TEXT_HEIGHT, FW_NORMAL, FALSE, crFg );
			break;
		case MD_ICON_MODE_H:	// mode switch: HTML
			DrawMdText( hdc, cx, L"H", MD_TEXT_HEIGHT, FW_BOLD, FALSE, crFg );
			break;
		case MD_ICON_MODE_M:	// mode switch: Markdown
			DrawMdText( hdc, cx, L"M", MD_TEXT_HEIGHT, FW_BOLD, FALSE, crFg );
			break;
		}
		}
		SelectObject( hdc, hbrOld );
		SelectObject( hdc, hpenOld );
		DeleteObject( hpen );
	}

	COLORREF GetBarGlyphColor()
	{
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
		COLORREF crBack = CLR_INVALID;
		Editor_Info( m_hWnd, EI_GET_BAR_BACK_COLOR, (LPARAM)&crBack );
		if( crBack == CLR_INVALID ){
			crBack = RGB( 255, 255, 255 );  // unknown: assume light, as dark themes currently leave the bars light
		}
		int nLum = ( 299 * GetRValue( crBack ) + 587 * GetGValue( crBack ) + 114 * GetBValue( crBack ) ) / 1000;
		if( nLum >= 128 ){
			return GLYPH_COLOR_DARK;   // light background -> dark glyphs
		}
		return GLYPH_COLOR_LIGHT;      // dark background -> light glyphs
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
			HBITMAP hbm = CreateMdIconBitmap( cx, &pvBits );
			if( !hbm ){
				break;
			}
			HDC hdc = CreateCompatibleDC( NULL );
			HBITMAP hbmOld = (HBITMAP)SelectObject( hdc, hbm );
			DrawMdIcon( hdc, cx, MD_ICON_MODE_H + i, crFg );
			SelectObject( hdc, hbmOld );
			DeleteDC( hdc );
			MdKeyOutBackground( cx, pvBits );
			ImageList_Add( himl, hbm, NULL );
			DeleteObject( hbm );
		}
	}

	HIMAGELIST BuildMdImageList( int cx, COLORREF crFg )
	{
		HIMAGELIST himl = ImageList_Create( cx, cx, ILC_COLOR32, 20, 8 );
		if( !himl ){
			return NULL;
		}
		for( int i = 0; i < 20; i++ ){
			void* pvBits = NULL;
			HBITMAP hbm = CreateMdIconBitmap( cx, &pvBits );
			if( !hbm ){
				break;
			}
			HDC hdc = CreateCompatibleDC( NULL );
			HBITMAP hbmOld = (HBITMAP)SelectObject( hdc, hbm );
			DrawMdIcon( hdc, cx, i, crFg );
			SelectObject( hdc, hbmOld );
			DeleteDC( hdc );
			MdKeyOutBackground( cx, pvBits );
			ImageList_Add( himl, hbm, NULL );
			DeleteObject( hbm );
		}
		return himl;
	}

	HIMAGELIST BuildHotImageList( int cx )
	{
		// hover fills buttons with the light system highlight, so the hot list
		// mirrors the normal list with dark glyphs to stay readable on it
		COLORREF crHotFg = GLYPH_COLOR_DARK;
		HIMAGELIST himl = NULL;
		if( m_iMode == MODE_MD ){
			himl = BuildMdImageList( cx, crHotFg );
			if( himl ){
				AddModeSwitchIcons( himl, cx, crHotFg );
			}
			return himl;
		}
		// HTML mode: the colored BMP icons read fine on the light fill, so
		// duplicate the normal list and replace only the two switch glyphs
		himl = ImageList_Duplicate( m_himageToolbar );
		if( himl ){
			int nCount = ImageList_GetImageCount( himl );
			ImageList_Remove( himl, nCount - 1 );
			ImageList_Remove( himl, nCount - 2 );
			AddModeSwitchIcons( himl, cx, crHotFg );
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
			int nImageDPI = (nDPI >= DEFAULT_DPI && nDPI <= 120) ? DEFAULT_DPI : nDPI;
			bool bLarge = false;
			if( m_bLargeToolbar || MulDiv( 16, nImageDPI, DEFAULT_DPI ) >= 24 ){
				bLarge = true;
			}
			int cxSrc = bLarge ? 24 : 16;
			int cxDest = MulDiv( m_bLargeToolbar ? 24 : 16, nImageDPI, DEFAULT_DPI );
			int cxButtonSize = MulDiv( m_bLargeToolbar ? 24 : 16, nDPI, DEFAULT_DPI );
			bool bNeedStretch = ( cxSrc != cxDest );

			//int cx = g_metrics.ScaleY( m_bLargeToolbar ? BUTTON_SIZE_LARGE : BUTTON_SIZE_SMALL );
			DWORD dwStyle = TBSTYLE_TOOLTIPS | TBSTYLE_TRANSPARENT | WS_CHILD | WS_CLIPCHILDREN | WS_CLIPSIBLINGS | CCS_NODIVIDER | CCS_NORESIZE | WS_VISIBLE | TBSTYLE_FLAT | CCS_NOPARENTALIGN | CCS_NOMOVEY;
			DWORD dwExStyle = TBSTYLE_EX_HIDECLIPPEDBUTTONS | TBSTYLE_EX_DRAWDDARROWS;
			HWND hwndToolbar = CreateWindowEx( 0, TOOLBARCLASSNAME, NULL, dwStyle,
				0, 0, 0, cxButtonSize, m_hDlg, (HMENU)(INT_PTR)100, NULL, NULL );
			m_hwndToolbar = hwndToolbar;
			SendMessage( hwndToolbar, TB_BUTTONSTRUCTSIZE, (WPARAM) sizeof(TBBUTTON), 0 ); 
			SendMessage( hwndToolbar, TB_SETBUTTONSIZE, 0, cxButtonSize );
			SendMessage( hwndToolbar, TB_SETEXTENDEDSTYLE, 0, dwExStyle );
			_ASSERT( m_himageToolbar == NULL );

			COLORREF crGlyphFg = GetBarGlyphColor();
			m_crGlyphFg = crGlyphFg;
			if( m_iMode == MODE_MD ){
				// runtime-drawn icons contrasting with the bar's real background
				m_himageToolbar = BuildMdImageList( cxButtonSize, crGlyphFg );
			}
			if( m_himageToolbar == NULL ){
				if( bNeedStretch ){
					m_himageToolbar = ImageList_Create( cxDest, cxDest, ILC_COLOR32 | ILC_MASK, 0, 32 );
					HBITMAP hbm = MyLoadBitmap( EEGetInstanceHandle(), MAKEINTRESOURCE( bLarge ? IDB_TOOLBAR_LARGE : IDB_TOOLBAR ) );
					_ASSERT( hbm );
					int nNumImages = GetBitmapCount( hbm, cxSrc );
					if( nNumImages != 0 ){
						VERIFY( StretchBitmap( &hbm, cxDest, cxDest, nNumImages, 1 ) );
						VERIFY( ImageList_AddMasked( m_himageToolbar, hbm, CLR_NONE ) == 0 );
					}
				}
				else {
					m_himageToolbar = ImageList_LoadImage( EEGetInstanceHandle(), MAKEINTRESOURCE( bLarge ? IDB_TOOLBAR_LARGE : IDB_TOOLBAR ), bLarge ? 24 : 16, 0, CLR_NONE, IMAGE_BITMAP, LR_CREATEDIBSECTION );
				}
			}
			_ASSERT( m_himageToolbar );
			AddModeSwitchIcons( m_himageToolbar, cxButtonSize, crGlyphFg );
			SendMessage( hwndToolbar, TB_SETIMAGELIST, 0, (LPARAM)m_himageToolbar );

			// on hover the toolbar fills buttons with the light system highlight;
			// when the band is dark (light glyphs) supply a hot image list with
			// dark glyphs so hovered buttons stay readable
			if( m_crGlyphFg == GLYPH_COLOR_LIGHT ){
				m_himageToolbarHot = BuildHotImageList( cxButtonSize );
				SendMessage( hwndToolbar, TB_SETHOTIMAGELIST, 0, (LPARAM)m_himageToolbarHot );
			}
			
			if( !LoadCmdArray( m_iMode ) ){
				ResetCmdArray( m_iMode );
			}

			AddButtons( hwndToolbar );
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
			}
		}
	}

	void OnCommand( HWND /*hwndView*/ )
	{
		DisplayBar( !IsVisible() );
	}

	void CustomBarClosed()
	{
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
	}

	BOOL QueryStatus( HWND /*hwndView*/, LPBOOL pbChecked )
	{		
		*pbChecked = IsVisible();
		return TRUE;
	}

	void OnEvents( HWND /*hwndView*/, UINT nEvent, LPARAM lParam )
	{
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
		m_nBand = (UINT)-1;
	}

	~CMyFrame()
	{
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
	}

	void OnPropInitDialog( HWND hDlg )
	{
		CenterWindow( hDlg );
		VERIFY( CheckDlgButton( hDlg, IDC_AUTO_DISPLAY, m_bAutoDisplay ) );

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

	void OnPropCommand( HWND hDlg, WPARAM wParam )
	{
		if( wParam == IDOK ){
			m_bAutoDisplay = !!IsDlgButtonChecked( hDlg, IDC_AUTO_DISPLAY );

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
		}
		else if( wParam == IDCANCEL ){
			EndDialog( hDlg, IDCANCEL );
		}
		else if( wParam == IDC_AUTO_DISPLAY ){
			BOOL bEnabled = IsDlgButtonChecked( hDlg, IDC_AUTO_DISPLAY );
			EnableWindow( GetDlgItem( hDlg, IDC_LIST ), bEnabled );
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
		if( m_iMode != iMode ){
			m_iMode = iMode;
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
		// re-create the bar when the glyph color flipped with the theme
		if( m_hwndToolbar && m_bVisible ){
			COLORREF crFg = GetBarGlyphColor();
			if( crFg != m_crGlyphFg ){
				Editor_ToolbarClose( m_hWnd, m_nClientID );
				CustomBarClosed();
				DisplayBar( true );
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

	void OnDlgNotify( NMHDR* pnmh )
	{
		switch( pnmh->code ){
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
					CCmd& cmd = Cmds()[pToolbar->iItem - ID_COMMAND_BASE];
					switch( cmd.m_iCmd ){
					case CMD_FONT:
						{
							int n = PopupMenuSub( pToolbar->iItem, IDR_POPUP_FONT );
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
							int n = PopupMenuSub( pToolbar->iItem, IDR_POPUP_HEADER );
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
							int n = PopupMenuSub( pToolbar->iItem, IDR_POPUP_FORM );
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

					}
				}
			}
			break;
		}
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
		int nCount = ImageList_GetImageCount( m_himageToolbar );
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
							LoadString( EEGetLocaleInstanceHandle(), ID_HEADER + (int)item.iItem - 1, item.pszText, item.cchTextMax );
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
			pFrame->OnDlgNotify( (NMHDR*)lParam );
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

