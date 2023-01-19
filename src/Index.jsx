import * as React from 'react'; 
import { useState } from 'react';

export default function Index() {
  const [count, setCount] = useState(0);

  return(<>
      <p class="text-xl font-bold underline">
        react app template using ESBuild & bun 😎
      </p>

      <h2>Count: {count}</h2>
      <button class="bg-red-500" onClick={() => setCount(count => count + 1)}>Increment</button>
  </>)
}
