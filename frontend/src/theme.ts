import { createTheme } from '@mui/material/styles'

export const appTheme = createTheme({
	palette: {
		mode: 'light',
		primary: { main: '#00B894' }, // green brand
		secondary: { main: '#006CFF' },
		success: { main: '#00B894' },
		background: { default: '#f6fbf8' },
	},
	shape: { borderRadius: 10 },
	components: {
		MuiAppBar: { styleOverrides: { root: { boxShadow: 'none' } } },
		MuiPaper: { styleOverrides: { root: { borderRadius: 12 } } },
		MuiButton: { styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
	},
})

