import * as React from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider, BrowserRouter } from 'react-router-dom'
import Home from './components/Home'
import Contracts from './components/Contracts'
import NotFound from './components/NotFound'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
    errorElement: <NotFound />,
  },
  {
    path: '/contracts/:contractId',
    element: <Contracts />,
    errorElement: <NotFound />,
  },
])

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <RouterProvider router={router} />
  </BrowserRouter>,
)
