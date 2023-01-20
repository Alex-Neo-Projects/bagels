import * as React from 'react'; 
import { createRoot } from 'react-dom/client'; 
import { Route } from "wouter";
import Home from './pages/Home'; 
import Contracts from './pages/Contracts';
import './styles/globals.css'

let App = () => (
  <div>
    <Route path="/contracts/:contract">{(params) => <Contracts contractName={params.contract}/>}</Route>
    <Route path="/" component={Home} />
  </div>
)


createRoot(document.getElementById('root')).render(<App />);
