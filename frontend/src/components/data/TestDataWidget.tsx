import React from 'react'
import DataDisplayWidget from './DataDisplayWidget'

const TestDataWidget: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>Test Data Widgets</h2>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="analytics" title="Test Analytics" />
        </div>
        <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="users" title="Test Users" />
        </div>
        <div style={{ flex: '1 1 300px', minWidth: '300px' }}>
          <DataDisplayWidget type="system" title="Test System" />
        </div>
      </div>
    </div>
  )
}

export default TestDataWidget
