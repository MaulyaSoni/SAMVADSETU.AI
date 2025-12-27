import React from 'react'

export default function ModelTest() {
  const [status, setStatus] = React.useState('Loading...')

  React.useEffect(() => {
    async function testModel() {
      try {
        const tf = await import('@tensorflow/tfjs')
        console.log('✓ TensorFlow.js loaded')
        
        // Try to load the model
        try {
          const model = await tf.loadGraphModel('/models/model.json')
          setStatus('✓ Model loaded successfully')
          console.log('✓ Model loaded')
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err)
          setStatus(`Model loading failed: ${errMsg}`)
          console.error('Model failed:', err)
        }

        // Try to load labels
        try {
          const resp = await fetch('/data/models/labels.json')
          const data = await resp.json()
          setStatus(`✓ Model + Labels (${data.classes.length} classes)`)
          console.log('✓ Labels loaded:', data.classes.length)
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : String(err)
          setStatus(`Labels failed: ${errMsg}`)
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err)
        setStatus(`Error: ${errMsg}`)
      }
    }

    testModel()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>ASL Model Test</h1>
      <p>{status}</p>
    </div>
  )
}
