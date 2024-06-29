import { Link } from "react-router-dom"
import Button from "./Button"


const Hero = () => {
    return (
        <section className="w-full h-2/3 ">
            <div className="container mx-auto h-full w-full flex flex-col justify-center items-center gap-2 ">
                <h2 className="text-8xl text-center">
                    Ace Your Job Interviews with Confidence.
                </h2>
                <h3 className="text-3xl text-center">Master your English interview skills with our interactive practice app.</h3>
                <div className="p-5">
                    <Link to="/login">
                        <Button className="py-2 px-5">Get Started</Button>
                    </Link>
                </div>

            </div>


        </section>
    )
}

export default Hero