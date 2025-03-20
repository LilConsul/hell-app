import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok')
        }
        return response.json()
      })
      .then((data) => {
        setData(data)
        setLoading(false)
      })
      .catch((error) => {
        setError(error.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white shadow-lg rounded-lg w-full sm:w-96">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          FastAPI + React Template
        </h1>
        <p className="text-xl text-gray-600 mb-6">
          This is a FastAPI-React-Template page with tailwindcss v4.<br/> Made by LilConsul
        </p>

        {loading && <p className="text-gray-500">Loading...</p>}
        {error && <p className="text-red-500">Error: {error}</p>}
        {data && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold text-gray-800">Message from API</h2>
            <pre className="text-sm text-gray-600 bg-gray-200 p-4 rounded-lg">
              {JSON.stringify(data, null)}
            </pre>
          </div>
        )}

        <a
          href="https://github.com/LilConsul"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline mt-6 block"
        >
          Visit my GitHub
        </a>
      </div>
    </div>
  )
}

export default App
