import * as React from 'react'
import { useState } from 'react'

export default function Index() {
  const [count, setCount] = useState(0)

  return (
    <>
      <h1>Welcome to a react app template using ESBuild & bun sadf 😎</h1>
      <h2>Count: {count}</h2>
      <button onClick={() => setCount((count) => count + 1)}>Increment</button>
    </>
  )
}
