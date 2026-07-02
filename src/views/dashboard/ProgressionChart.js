import React from 'react'
import PropTypes from 'prop-types'
import { CChartLine } from '@coreui/react-chartjs'

const ProgressionChart = ({ exerciseName, data }) => {
  // Logic: Group 'data' by date, take the MAX weight for that date

  const groupedData = {}
  data.forEach((log) => {
    const dateStr = new Date(log.created_at).toLocaleDateString()
    if (!groupedData[dateStr] || log.weight > groupedData[dateStr]) {
      groupedData[dateStr] = log.weight
    }
  })

  const weights = Object.values(groupedData)

  let minWeight = weights.length > 0 ? Math.min(...weights) : 0
  let maxWeight = weights.length > 0 ? Math.max(...weights) : 100

  if (minWeight === maxWeight) {
    //fallback if only one session is logged
    minWeight -= 5
    maxWeight += 5
  }

  const chartData = {
    labels: Object.keys(groupedData),
    datasets: [
      {
        label: 'Weight (lbs)',
        data: Object.values(groupedData),
        borderColor: '#321fdb',
        fill: false,
      },
    ],
  }

  return (
    <CChartLine
      data={chartData}
      options={{
        maintainAspectRatio: false,
        scales: {
          y: {
            min: minWeight,
            max: maxWeight,
          },
        },
      }}
      style={{ height: '300px', marginTop: '40px' }}
    />
  )
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
