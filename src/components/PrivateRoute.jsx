import { Navigate } from "react-router-dom"
import { useAuth } from "../context/authContext"

const PrivateRoute = ({ children }) => {

    const { user } = useAuth()

    return user ? children : user === false ? <Navigate to = {'/'} />  : <div>Cargando...</div>
}

export default PrivateRoute