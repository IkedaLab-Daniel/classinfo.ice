import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { SiReact, SiTailwindcss, SiFramer, SiLaravel, SiNodedotjs, SiExpress, SiMongodb } from 'react-icons/si'
import ice from '../assets/ice.jpeg'

const FooterVanilla = () => {
  const [repoData, setRepoData] = useState(null);
  const [commits, setCommits] = useState([]);
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);

  const REPO_OWNER = "IkedaLab-Daniel";
  const REPO_NAME = "classinfo.ice";

  // Updated project tech stack for this project
  const projectStack = [
    { id: "react", name: "React", icon: SiReact, color: "#61dafb" },
    { id: "node", name: "Node.js", icon: SiNodedotjs, color: "#339933" },
    { id: "express", name: "Express", icon: SiExpress, color: "#000000" },
    { id: "mongodb", name: "MongoDB", icon: SiMongodb, color: "#47A248" }
  ]

  useEffect(() => {
    const fetchGitHubData = async () => {
      try {
        // Fetch repository data
        const repoResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`);
        const repoData = await repoResponse.json();
        setRepoData(repoData);
        console.log(repoData)

        // Fetch recent commits
        const commitsResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/commits?per_page=3`);
        const commitsData = await commitsResponse.json();
        setCommits(commitsData);

        // Fetch contributors
        const contributorsResponse = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contributors?per_page=5`);
        const contributorsData = await contributorsResponse.json();
        setContributors(contributorsData);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching GitHub data:', error);
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, []);

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num?.toString() || '0';
  };

  // Show loading state or use fallback data if API fails
  const displayData = repoData || {
    name: "ClassInfo",
    description: "A comprehensive class schedule management system built with React and Node.js. Features real-time updates, task management, and announcement system.",
    language: "JavaScript",
    license: { name: "MIT License" },
    stargazers_count: 0,
    forks_count: 0,
    open_issues_count: 0,
    html_url: `https://github.com/${REPO_OWNER}/${REPO_NAME}`,
    updated_at: new Date().toISOString()
  };

  return (
    <>
      <footer className="footer-vanilla">
        <div className="footer-container">
          <div className="footer-grid">
            
            {/* Repository Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="footer-section"
            >
              <div className="repo-info">
                <div className="repo-icons">
                  <motion.img 
                    src={ice}
                    className="repo-avatar"
                    alt="Project Avatar"
                  />
                  <div className="github-icon-container">
                    <svg className="github-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                <div className="repo-details">
                  <h3 className="repo-name">{displayData.name}</h3>
                  <p className="repo-owner">@IkedaLab-Daniel</p>
                </div>
              </div>

              {/* project tech stack */}
              <motion.div 
                className="tech-stack"
                initial={{ y: 0 }}
                animate={{ y: [0, -2, 0] }}
              >
                {projectStack.map((tech, idx) => {
                  const Icon = tech.icon;
                  return (
                    <motion.div
                      key={tech.id}
                      className="tech-item"
                      initial={{ y: 0 }}
                      animate={{ y: [0, -3, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 2,
                        ease: "easeInOut",
                        delay: idx * 0.5
                      }}
                    >
                      <Icon className="tech-icon" style={{ color: tech.color }} />
                    </motion.div>
                  );
                })}
              </motion.div>

              <p className="repo-description">
                {displayData.description}
              </p>
            </motion.div>

            {/* Repository Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="footer-section"
            >
              <h4 className="section-title">Repository Stats</h4>
              <div className="stats-grid">
                <div className="stat-card stat-stars">
                  <div className="stat-header">
                    <span className="stat-label">Stars</span>
                    <svg className="stat-icon star-icon" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                  <div className="stat-value">
                    {loading ? "..." : formatNumber(displayData.stargazers_count)}
                  </div>
                </div>
                
                <div className="stat-card stat-forks">
                  <div className="stat-header">
                    <span className="stat-label">Forks</span>
                    <svg className="stat-icon fork-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                  </div>
                  <div className="stat-value">
                    {loading ? "..." : formatNumber(displayData.forks_count)}
                  </div>
                </div>
                
                <div className="stat-card stat-issues">
                  <div className="stat-header">
                    <span className="stat-label">Issues</span>
                    <svg className="stat-icon issue-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="stat-value">
                    {loading ? "..." : formatNumber(displayData.open_issues_count)}
                  </div>
                </div>
                
                <div className="stat-card stat-language">
                  <div className="stat-header">
                    <span className="stat-label">Language</span>
                    <svg className="stat-icon language-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                  <div className="stat-value language-value">
                    {loading ? "..." : (displayData.language || "N/A")}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Recent Activity & Contributors */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="footer-section"
            >
              {/* Recent Commits */}
              <div className="activity-section">
                <h4 className="section-title">Recent Activity</h4>
                <div className="commits-list">
                  {loading ? (
                    [...Array(3)].map((_, i) => (
                      <div key={i} className="commit-item loading">
                        <div className="commit-dot loading-dot"></div>
                        <div className="commit-content">
                          <div className="commit-message loading-message"></div>
                          <div className="commit-time loading-time"></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    commits.slice(0, 3).map((commit, index) => (
                      <div key={commit.sha} className="commit-item">
                        <div className={`commit-dot commit-dot-${index}`}></div>
                        <div className="commit-content">
                          <p className="commit-message">
                            {commit.commit?.message?.split('\n')[0] || 'Updated repository'}
                          </p>
                          <p className="commit-time">
                            {formatTimeAgo(commit.commit?.author?.date)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Top Contributors */}
              <div className="contributors-section">
                <h4 className="section-title">Top Contributors</h4>
                <div className="contributors-list">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="contributor-avatar loading-avatar"
                      />
                    ))
                  ) : (
                    contributors.slice(0, 5).map((contributor, index) => (
                      <motion.img
                        key={contributor.id}
                        whileHover={{ scale: 1.1, zIndex: 10 }}
                        src={contributor.avatar_url}
                        alt={contributor.login}
                        title={contributor.login}
                        className="contributor-avatar"
                      />
                    ))
                  )}
                  {contributors.length > 5 && (
                    <div className="contributor-more">
                      +{contributors.length - 5}
                    </div>
                  )}
                </div>
              </div>

              {/* GitHub Link */}
              <motion.a
                href={displayData.html_url}
                target="_blank"
                rel="noopener noreferrer"
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: [1, 1.02, 1],
                  boxShadow: [
                    "0 0 4px 2px rgba(36,99,235,0.1)",
                    "0 0 16px 2px rgba(36,99,235,0.3)",
                    "0 0 4px 2px rgba(36,99,235,0.1)"
                  ]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut"
                }}
                className="github-link"
              >
                <svg className="github-link-icon" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                </svg>
                View on GitHub
              </motion.a>
            </motion.div>
          </div>

          {/* Bottom Bar */}
          <div className="footer-bottom">
            <div className="footer-copyright">
              <span>© 2025 {displayData.name}</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}

export default FooterVanilla
