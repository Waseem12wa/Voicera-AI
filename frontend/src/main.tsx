import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Provider } from 'react-redux'
import { QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider, CssBaseline } from '@mui/material'
import { SnackbarProvider } from 'notistack'
import './index.css'
import App from './App.tsx'
import { store } from './store/store.ts'
import { queryClient } from './store/queryClient.ts'
import { appTheme } from './theme.ts'

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<Provider store={store}>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider theme={appTheme}>
					<CssBaseline />
					<SnackbarProvider maxSnack={3} autoHideDuration={3000}>
						<BrowserRouter>
							<App />
						</BrowserRouter>
					</SnackbarProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</Provider>
	</StrictMode>,
)
