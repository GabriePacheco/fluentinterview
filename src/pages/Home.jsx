import Hero from "../components/Hero"
import HeroExtend from "../components/HeroExtend"
import Nav from "../components/Nav"


const Home = () => {
    return (
        <div className="w-full h-screen bg-normal">
            <Nav />
            <Hero />
            <HeroExtend />

        </div>
    )
}

export default Home