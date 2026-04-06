import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export function Toast() {
  return (
    <ToastContainer
      position="bottom-right"
      autoClose={4000}
      hideProgressBar={false}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      toastClassName="text-sm font-medium"
    />
  )
}
