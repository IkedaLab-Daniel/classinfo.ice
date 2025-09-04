import Dashboard from '../components/Dashboard'
import Today from '../components/Today'
import Weekly from '../components/Weekly'
import Tasks from '../components/Tasks'
import Footer from '../components/Footer'
import FooterFramer from '../components/FooterFramer'
import FooterVanilla from '../components/FooterVanilla'
import Announcement from '../components/Announcement'

const Home = () => {
    return(
        <>
            <Dashboard />
            <Announcement />
            <div id="today-page">
                <Today />
            </div>
            <div id="weekly">
                <Weekly />
            </div>
            <div id="tasks">
                <Tasks />
            </div>
            <FooterVanilla />
        </>
    )
}

export default Home