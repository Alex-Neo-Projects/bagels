import { useEffect, useState } from 'react'
import Header from '../components/Header'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { SERVER_URL } from '../constants.js'

export default function Home() {
  const [solidityFiles, setSolidityFiles] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function loadBasics() {
      setLoading(true)
      await getSolidityFiles()
      setLoading(false)
    }

    loadBasics()
  }, [])

  async function getSolidityFiles() {
    const result = await fetch(`${SERVER_URL}/solidityFiles`, {
      method: 'GET',
    })
    const jsonifiedResult = await result.json()
    setSolidityFiles(jsonifiedResult['files'])
  }

  const solidityFileChoices = solidityFiles.map((item) => {
    return (
      <a href={`/contracts/${item}`}>
        <div className="flex flex-col items-left h-full p-4 bg-[#93939328] hover:bg-[#0E76FD] rounded-xl text-white ">
          <p className="font-bold">{item}</p>
        </div>
      </a>
    )
  })

  return (
    <Header>
      <div className="flex flex-col w-full justify-center items-center space-y-10 overflow-auto">
        <div className="flex w-screen max-w-[35em] px-2">
          <div className="text-white block border border-[#93939328] rounded-2xl h-full w-full p-6 pl-4 pr-4 space-y-4">
            <div className="flex flex-row justify-between items-center max-w-prose">
              <p className="text-2xl tracking-tighter text-left font-bold">
                Select a contract
              </p>
            </div>

            {loading && (
              <LoadingSpinner></LoadingSpinner>
            )}

            {!loading && solidityFiles.length === 0 && (
              <div className="flex flex-col justify-start items-start pt-3 pb-10">
                <p className="text-md text-bold text-center pl-3 pr-3 p-3 border border-1 border-[#FF0057] text-[#FF0057] rounded-lg">
                  Uh, we are unable to find any solidity files in this
                  directory.
                </p>
              </div>
            )}

            {!loading && solidityFiles.length > 0 && (
              <div className="flex flex-col justify-start space-y-2">
                {solidityFileChoices}
              </div>
            )}
          </div>
        </div>
      </div>
    </Header>
  )
}
