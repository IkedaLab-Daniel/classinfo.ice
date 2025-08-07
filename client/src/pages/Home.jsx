import Dashboard from '../components/Dashboard'
import Today from '../components/Today'
import Weekly from '../components/Weekly'
import Tasks from '../components/Tasks'
import Footer from '../components/Footer'
import Announcement from '../components/Announcement'

const Home = () => {
    return(
        <>
            <Dashboard />
            <Announcement />
            <div id="today-page">
                <Today />
            </div>
            <div id="weekly" style={{ minHeight: '100vh', paddingTop: '20px', paddingBottom: '40px' }}>
                <Weekly />
            </div>
            <div id="tasks">
                <Tasks />
            </div>
            <Footer />
        </>
    )
}

export default Home