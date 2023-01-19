import * as React from 'react'
import { createRoot } from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
  BrowserRouter,
} from 'react-router-dom'
import Home from './routes/Home'
import Contracts from './routes/Contracts'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/contracts/:contractId',
    element: <Contracts />,
  },
])

createRoot(document.getElementById('root')).render(
  <RouterProvider router={router} />,
)
