import Dashboard from '../components/Dashboard'
import Today from '../components/Today'
import Weekly from '../components/Weekly'
import Footer from '../components/Footer'
import Announcement from '../components/Announcement'
const Home = () => {
    return(
        <>
            <Dashboard />
            <Announcement />
            <Today />
            <Weekly />
            <Footer />
        </>
    )
}

export default Home