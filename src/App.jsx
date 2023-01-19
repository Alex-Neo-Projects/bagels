import * as React from 'react'; 
import { createRoot } from 'react-dom/client'; 
import './styles/globals.css'
import Home from './Home';

let App = () => <Home />

createRoot(document.getElementById('root')).render(<App />);
