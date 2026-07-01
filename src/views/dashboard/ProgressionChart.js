import React from 'react'
import PropTypes from 'prop-types'
import { CChartLine } from '@coreui/react-chartjs'

const ProgressionChart = ({ exerciseName, data }) => {
  // Logic: Group 'data' by date, take the MAX weight for that date
  const chartData = {
    labels: [...new Set(data.map((log) => log.created_at.split('T')[0]))],
    datasets: [
      {
        label: 'Weight (lbs)',
        data: data.map((log) => log.weight),
        borderColor: '#321fdb',
        fill: false,
      },
    ],
  }

  return <CChartLine data={chartData} />
}

ProgressionChart.propTypes = {
  exerciseName: PropTypes.string,
  data: PropTypes.arrayOf(
    PropTypes.shape({
      created_at: PropTypes.string.isRequired,
      weight: PropTypes.number.isRequired,
    }),
  ).isRequired,
}

export default ProgressionChart
