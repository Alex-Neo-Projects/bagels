import { useEffect, useState } from 'react';
import Header from './components/Header';

export default function Home() {
  const [solidityFiles, setSolidityFiles] = useState([]); 
  const [loading, setLoading] = useState(true); 

  async function getSolidityFiles() { 
    const result = await fetch('http://localhost:3001/solidityFiles', {
      method: 'GET', 
    })
    const jsonifiedResult = await result.json();

    setSolidityFiles(jsonifiedResult['files']); 
  }

  useEffect(() => {
    async function loadBasics() { 
      await getSolidityFiles(); 
      setLoading(false);
    }
    loadBasics();
  }, [])

  const solidityFileChoices = solidityFiles.map((item) => {
    return ( 
      <a href={`/contracts/${item}`}>
        <div className='flex flex-col justify-between items-center space-y-1 h-full p-4 pl-4 pr-4 bg-blue-500 border border-[#E5DEDE40] rounded-lg m-4'>
          <p className='text-white'>{item}</p>
        </div>
      </a>
    )
  })

  return (
    <Header>
      {!loading && solidityFiles.length === 0 ? (
        <p>No solidity files found.</p>
      ) : (
        <div>
          <p className="text-4xl font-bold">Available contracts for testing: </p>

          {solidityFileChoices}
        </div>
      )}
    </Header> 
  )
}

