import hero_2 from '../assets/hero_2.mp4'

const HeroExtend = () => {
    return (
        <section className="w-full h-full bg-normal">
            <div className="container mx-auto flex h-full">
                <div className="flex justify-center items-start h-full">
                    <video className="w-full h-full"  src={hero_2} autoPlay = {true} />
                </div>

            </div>

        </section>
    )
}

export default HeroExtend