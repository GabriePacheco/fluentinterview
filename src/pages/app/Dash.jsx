import { Navigate } from "react-router-dom"
import { useAuth } from "../../context/authContext"

const Dash = () => {
    const  { userSettings } = useAuth()

    if (userSettings === undefined)  return <Navigate  to = "register" />
  return (
    <div>Dash</div>
  )
}

export default Dash