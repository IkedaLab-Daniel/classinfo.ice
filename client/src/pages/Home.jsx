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
            <div id="weekly" style={{ minHeight: '400px', paddingTop: '10px', paddingBottom: '10px' }}>
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