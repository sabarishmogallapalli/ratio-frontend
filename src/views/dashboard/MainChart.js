import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { CChartLine } from '@coreui/react-chartjs'
import { getStyle } from '@coreui/utils'
import { supabase } from '../../supabaseClient.js'

const MainChart = ({ timeFilter, splitFilter }) => {
  const chartRef = useRef(null)
  const [chartLabels, setChartLabels] = useState([])
  const [chartDataPoints, setChartDataPoints] = useState([])

  useEffect(() => {
    async function fetchFilteredData() {
      const now = new Date()
      let startDate = new Date()

      if (timeFilter === 'Day') startDate.setDate(now.getDate() - 1)
      else if (timeFilter === 'Week') startDate.setDate(now.getDate() - 7)
      else if (timeFilter === 'Month') startDate.setMonth(now.getMonth() - 1)
      else if (timeFilter === 'Year') startDate.setFullYear(now.getFullYear() - 1)

      // 1. Start a basic query
      let query = supabase
        .from('exercise_logs')
        .select('*')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      const upperLifts = [
        'flat dumbbell press',
        'flat db press',
        'cable fly',
        'lat pulldown',
        'overhead cable tricep extension',
        'machine lateral raise',
        'high incline smith press',
        'smith machine press',
        'incline smith',
        't-bar row',
        'supported row',
        'ez-bar bicep curl',
        'bicep curl',
        'ez-bar',
        'cable crunch',
      ]
      const lowerLifts = [
        'dumbbell romanian deadlift',
        'romanian deadlift',
        'rdl',
        'dumbbell step up',
        'step up',
        'seated leg press toe-press',
        'toe-press',
        'calf raise',
        'hack squat',
        'barbell back squat',
        'seated leg curl',
        'leg curl',
      ]

      // 2. Apply split filter using the full arrays!
      if (splitFilter === 'Upper') {
        query = query.in('exercise_name', upperLifts)
      } else if (splitFilter === 'Lower') {
        query = query.in('exercise_name', lowerLifts)
      }

      const { data, error } = await query
      if (!error && data) {
        // Group the data by date and find the max weight lifted that day
        const groupedData = {}
        data.forEach((log) => {
          const dateStr = new Date(log.created_at).toLocaleDateString([], {
            month: 'short',
            day: 'numeric',
          })
          if (!groupedData[dateStr] || log.weight > groupedData[dateStr]) {
            groupedData[dateStr] = log.weight
          }
        })

        setChartLabels(Object.keys(groupedData))
        setChartDataPoints(Object.values(groupedData))
      }
    }

    fetchFilteredData()
  }, [timeFilter, splitFilter])

  // CoreUI styling effect
  useEffect(() => {
    document.documentElement.addEventListener('ColorSchemeChange', () => {
      if (chartRef.current) {
        setTimeout(() => {
          chartRef.current.options.scales.x.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.x.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.x.ticks.color = getStyle('--cui-body-color')
          chartRef.current.options.scales.y.grid.borderColor = getStyle(
            '--cui-border-color-translucent',
          )
          chartRef.current.options.scales.y.grid.color = getStyle('--cui-border-color-translucent')
          chartRef.current.options.scales.y.ticks.color = getStyle('--cui-body-color')
          chartRef.current.update()
        })
      }
    })
  }, [chartRef])

  return (
    <>
      <CChartLine
        ref={chartRef}
        style={{ height: '300px', marginTop: '40px' }}
        data={{
          labels: chartLabels.length > 0 ? chartLabels : ['No Data'],
          datasets: [
            {
              label: 'Highest Weight Lifted (lbs)',
              backgroundColor: `rgba(${getStyle('--cui-info-rgb')}, .1)`,
              borderColor: getStyle('--cui-info'),
              pointHoverBackgroundColor: getStyle('--cui-info'),
              borderWidth: 2,
              data: chartDataPoints.length > 0 ? chartDataPoints : [0],
              fill: true,
            },
          ],
        }}
        options={{
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            x: {
              grid: {
                color: getStyle('--cui-border-color-translucent'),
                drawOnChartArea: false,
              },
              ticks: {
                color: getStyle('--cui-body-color'),
              },
            },
            y: {
              beginAtZero: true,
              border: {
                color: getStyle('--cui-border-color-translucent'),
              },
              grid: {
                color: getStyle('--cui-border-color-translucent'),
              },
              ticks: {
                color: getStyle('--cui-body-color'),
                maxTicksLimit: 5,
                stepSize: Math.ceil(250 / 5),
              },
            },
          },
          elements: {
            line: {
              tension: 0.4,
            },
            point: {
              radius: 4,
              hitRadius: 10,
              hoverRadius: 4,
            },
          },
        }}
      />
    </>
  )
}

// Satisfy the ESLint props validation requirement
MainChart.propTypes = {
  timeFilter: PropTypes.string,
  splitFilter: PropTypes.string,
}

export default MainChart
