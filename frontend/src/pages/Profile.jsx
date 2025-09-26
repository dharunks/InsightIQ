import { useAuthStore } from '../stores/authStore'

const Profile = () => {
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Profile Settings
        </h1>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">First Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  defaultValue={user?.firstName}
                  placeholder="Enter your first name"
                />
              </div>
              <div>
                <label className="form-label">Last Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  defaultValue={user?.lastName}
                  placeholder="Enter your last name"
                />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input 
                  type="email" 
                  className="form-input" 
                  defaultValue={user?.email}
                  disabled
                />
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-4">Professional Details</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Job Title</label>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="e.g., Software Engineer"
                />
              </div>
              <div>
                <label className="form-label">Industry</label>
                <select className="form-input">
                  <option>Technology</option>
                  <option>Finance</option>
                  <option>Healthcare</option>
                  <option>Marketing</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="form-label">Experience Level</label>
                <select className="form-input">
                  <option>Entry Level (0-2 years)</option>
                  <option>Mid Level (2-5 years)</option>
                  <option>Senior Level (5+ years)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button className="btn-primary">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile