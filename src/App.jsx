import * as React from 'react'; 
import { createRoot } from 'react-dom/client'; 
import Index from './Index';

let App = () => <Index />

createRoot(document.getElementById('root')).render(<App />);
