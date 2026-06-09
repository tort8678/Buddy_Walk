import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './pages/home/App.tsx'
import Test from "./pages/main/index.tsx";
import Name from "./pages/name/index.tsx";
import './index.css'
import { createBrowserRouter, RouterProvider} from "react-router-dom";
import Waiver from "./pages/Waiver/index.tsx";
import Welcome from './pages/home/Welcome.tsx';
import SelectUI from './pages/selectui/index.tsx';

function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#000', color: '#fff', fontFamily: 'Poppins, Arial, sans-serif' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>Page not found.</p>
      <a href="/" style={{ color: '#fff', textDecoration: 'underline', fontSize: '1.2rem' }}>Go home</a>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Welcome/>
  },
  {
    path: "/enable",
    element: <App />
  },
  {
    path: "/main",
    element: <Test />
  },
  {
    path: "/waiver",
    element: <Waiver />
  },
  {
    path: "/name",
    element: <Name />
  },
  {
    path: "*",
    element: <NotFound />
  },
  {
    path: "/selectui",
    element: <SelectUI />
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
