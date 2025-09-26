const Settings = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="card">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Settings
        </h1>
        
        <div className="space-y-8">
          {/* Interview Preferences */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Interview Preferences</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Preferred Interview Types</label>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  {['Technical', 'Behavioral', 'HR', 'Situational'].map(type => (
                    <label key={type} className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      {type}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Default Difficulty</label>
                <select className="form-input">
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Notifications</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                Email reminders for practice sessions
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                Weekly progress reports
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" />
                New feature announcements
              </label>
            </div>
          </div>

          {/* Privacy Settings */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Privacy & Data</h2>
            <div className="space-y-4">
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" defaultChecked />
                Allow data analysis for improving AI feedback
              </label>
              <label className="flex items-center">
                <input type="checkbox" className="mr-3" />
                Share anonymized performance data for research
              </label>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button className="btn-primary">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  )
}

export default Settings