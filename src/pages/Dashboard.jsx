import { Outlet } from "react-router-dom"
import Nav from "../components/app/Nav"


const Dashboard = () => {
  return (
    <div className="w-full min-h-screen  bg-normal">
      <Nav />
      <div className="w-full h-full min-h-full pt-16">
        <Outlet />
      </div>
    </div>
  )
}

export default Dashboard