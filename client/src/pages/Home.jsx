import Dashboard from '../components/Dashboard'
import Today from '../components/Today'
import Footer from '../components/Footer'
import Announcement from '../components/Announcement'
const Home = () => {
    return(
        <>
            <Dashboard />
            <Announcement />
            <Today />
            <Footer />
        </>
    )
}

export default Home