import { BiTrash } from "react-icons/bi";
import { useAuth } from "../../context/authContext"
import { IoChevronForward } from "react-icons/io5";
import { FaPowerOff } from "react-icons/fa";
import { Link } from "react-router-dom";

const Profile = () => {

    const { user, logOuth } = useAuth()

    return (
        <section className="w-full h-full pt-5">
            <div className="md:w-2/4  w-11/12 mx-auto bg-white shadow p-5 rounded-lg">
                <div className="flex justify-left items-start gap-3">
                    <div className="w-16 h-16 rounded-full overflow-hidden flex justify-center items-center">
                        <img src={user.photoURL} alt="photo profile" className="object-cover w-full h-full " />
                    </div>
                    <div className="flex flex-col">
                        <strong className="">{user.displayName}</strong>
                        <small>{user.email}</small>
                    </div>
                </div>
                <div className="w-full pt-4">
                    <ul className="w-full">
                        <li className="flex justify-between items-center  hover:bg-secondary h-full py-4 hover:rounded-lg border-b">
                            <span>English Level</span>
                            <span><IoChevronForward /></span>

                        </li>
                        <li className="flex justify-between items-center  hover:bg-secondary h-full py-4 hover:rounded-lg  border-b">
                            <span>Native Lenguage</span>
                            <span><IoChevronForward /></span>

                        </li>

                        <li className="flex justify-between items-center  hover:bg-secondary h-full py-4 hover:rounded-lg  border-b">
                            <span>Avatar</span>
                            <span><IoChevronForward /></span>

                        </li>


                        <li className="flex justify-between items-center  hover:bg-secondary h-full py-4 hover:rounded-lg  border-b">
                            <span>Invite a friend</span>
                            <span><IoChevronForward /></span>

                        </li>

                        <li className="flex justify-between items-center  hover:bg-secondary h-full py-4 hover:rounded-lg">
                            <span>Subscription</span>
                            <span><IoChevronForward /></span>

                        </li>

                    </ul>
                </div>
            </div>
            <div className="md:w-2/4 w-11/12 mx-auto bg-white shadow  p-5 rounded-lg mt-2">
                <ul className="w-full">
                    <li className="flex justify-between items-center  hover:bg-secondary h-full py-4 hover:rounded-lg">
                        <span>App lanuage</span>
                        <span><IoChevronForward /></span>

                    </li>
                </ul>

            </div>
            <div className="md:w-2/4 w-11/12 mx-auto bg-white shadow  p-5 rounded-lg mt-2">
                <ul className="w-full">
                    <li className=" hover:bg-secondary h-full py-4 hover:rounded-lg  border-b ">
                        <Link className="flex justify-between items-center" to={'/terms'} >
                            <span>Terms & Conditions</span>
                            <span><IoChevronForward /></span>
                        </Link>

                    </li>
                    <li className="hover:bg-secondary h-full py-4 hover:rounded-lg">
                        <Link className="flex justify-between items-center" to={'/privacy'} >
                            <span>Privacy Politcy</span>
                            <span><IoChevronForward /></span>
                        </Link>


                    </li>
                </ul>

            </div>
            <div className="md:w-2/4 w-11/12 mx-auto p-5 mt-2">
                <div className="flex justify-between w-full text-sm">
                    <button className="flex justify-start items-center gap-2"> <BiTrash /> Delete account</button>
                    <button className="flex justify-start items-center gap-2"> <FaPowerOff onClick={() => logOuth()} />Sign Out</button>
                </div>


            </div>
        </section>
    )
}

export default Profile