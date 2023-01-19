import * as React from 'react'; 
import { createRoot } from 'react-dom/client'; 
import './styles/globals.css'
import Home from './pages/Home';
import { Link, Route } from "wouter";
import Contracts from './pages/Contracts';

let App = () => (
  <div>
    <Link href="/users/1">
      <a className="link">Profile</a>
    </Link>

    <Route path="/users/:name">{(params) => <div>Hello, {params.name}!</div>}</Route>

    <Route path='/' component={Home}/>
    <Route path='/asdf' component={Contracts} />
  </div>
)
// let App = () => <Home />

createRoot(document.getElementById('root')).render(<App />);
