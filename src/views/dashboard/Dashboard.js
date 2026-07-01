import classNames from 'classnames'
import React, { useState, useEffect } from 'react'

import {
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CFormSelect,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilFire, cilBurger, cilFastfood, cilDrop } from '@coreui/icons'
import ProgressionChart from './ProgressionChart'
import { supabase } from '../../supabaseClient.js'

const Dashboard = () => {
  // ALL STATE MUST BE INSIDE THE COMPONENT!
  const [recentExercises, setRecentExercises] = useState([])
  const [splitFilter, setSplitFilter] = useState('All')
  const [weeklyTotals, setWeeklyTotals] = useState({})

  const [macroTargets, setMacroTargets] = useState({
    calories: 2500,
    protein: 156,
    carbs: 250,
    fat: 75,
  })

  const weeklyProgress = React.useMemo(() => {
    return Object.keys(weeklyTotals).map((day) => {
      return {
        day: day,
        pCal: Math.min(Math.round((weeklyTotals[day].calories / macroTargets.calories) * 100), 100),
        pPro: Math.min(Math.round((weeklyTotals[day].protein / macroTargets.protein) * 100), 100),
        pCarb: Math.min(Math.round((weeklyTotals[day].carbs / macroTargets.carbs) * 100), 100),
        pFat: Math.min(Math.round((weeklyTotals[day].fat / macroTargets.fat) * 100), 100),
      }
    })
  }, [weeklyTotals, macroTargets])

  const [recentMeals, setRecentMeals] = useState([])

  const [selectedExercise, setSelectedExercise] = useState('flat dumbbell press')
  const [progressionData, setProgressionData] = useState([])
  const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 })
  useEffect(() => {
    async function fetchProgression() {
      const { data } = await supabase
        .from('exercise_logs')
        .select('created_at, weight, reps')
        .eq('exercise_name', selectedExercise)
        .order('created_at', { ascending: true })
      if (data) setProgressionData(data)
    }
    async function fetchDashboardStats() {
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('exercise_name', selectedExercise)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setRecentExercises(data.slice(0, 6))
      }
    }

    async function fetchFoodLogs() {
      const startDate = new Date()
      startDate.setHours(0, 0, 0, 0)
      const { data: mealData, error: mealError } = await supabase
        .from('food_logs')
        .select('*')
        //.gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false })

      if (!mealError && mealData) {
        console.log('Fetched Meals:', mealData)
        setRecentMeals(mealData.slice(0, 6))
        // Breaking these into individual declarations keeps Prettier happy!
        let cals = 0
        let pro = 0
        let carb = 0
        let f = 0
        mealData.forEach((meal) => {
          cals += meal.calories || 0
          pro += meal.protein || 0
          carb += meal.carbs || 0
          f += meal.fat || 0
        })
        setDailyTotals({ calories: cals, protein: pro, carbs: carb, fat: f })
      } else if (mealError) {
        console.error('Supabase Error:', mealError)
      }

      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .limit(1)
      if (!profileError && profileData && profileData.length > 0) {
        setMacroTargets({
          calories: profileData[0].target_calories,
          protein: profileData[0].target_protein,
          carbs: profileData[0].target_carbs,
          fat: profileData[0].target_fat,
        })
      }
    }

    async function fetchWeeklyFoodLogs() {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

      const { data: weekData } = await supabase
        .from('food_logs')
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (weekData) {
        const weeklyMap = {}
        weekData.forEach((meal) => {
          const dateKey = new Date(meal.created_at).toLocaleDateString('en-US', { weekday: 'long' })
          if (!weeklyMap[dateKey])
            weeklyMap[dateKey] = { calories: 0, protein: 0, carbs: 0, fat: 0 }
          weeklyMap[dateKey].calories += meal.calories || 0
          weeklyMap[dateKey].protein += meal.protein || 0
          weeklyMap[dateKey].carbs += meal.carbs || 0
          weeklyMap[dateKey].fat += meal.fat || 0
        })
        setWeeklyTotals(weeklyMap)
      }
    }
    fetchDashboardStats()
    fetchFoodLogs()
    fetchWeeklyFoodLogs()
    fetchProgression()

    const interval = setInterval(() => {
      fetchDashboardStats()
      fetchFoodLogs()
      fetchWeeklyFoodLogs()
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedExercise])

  const dynamicMacros = [
    {
      title: 'Calories',
      icon: cilFire,
      percent: Math.min(Math.round((dailyTotals.calories / macroTargets.calories) * 100) || 0, 100),
      value: `${dailyTotals.calories} / ${macroTargets.calories}`,
      color: 'info',
    },
    {
      title: 'Protein',
      icon: cilBurger,
      percent: Math.min(Math.round((dailyTotals.protein / macroTargets.protein) * 100) || 0, 100),
      value: `${dailyTotals.protein}g / ${macroTargets.protein}g`,
      color: 'danger',
    },
    {
      title: 'Carbohydrates',
      icon: cilFastfood,
      percent: Math.min(Math.round((dailyTotals.carbs / macroTargets.carbs) * 100) || 0, 100),
      value: `${dailyTotals.carbs}g / ${macroTargets.carbs}g`,
      color: 'warning',
    },
    {
      title: 'Fat',
      icon: cilDrop,
      percent: Math.min(Math.round((dailyTotals.fat / macroTargets.fat) * 100) || 0, 100),
      value: `${dailyTotals.fat}g / ${macroTargets.fat}g`,
      color: 'success',
    },
  ]

  const dynamicProgress = [
    {
      title: 'Upper Body',
      // value: `${stats.upperCount} Lifts`,
      // percent: Math.round((stats.upperCount / stats.total) * 100),
      color: 'primary',
      filterValue: 'Upper',
    },
    {
      title: 'Lower Body',
      // value: `${stats.lowerCount} Lifts`,
      // percent: Math.round((stats.lowerCount / stats.total) * 100),
      color: 'secondary',
      filterValue: 'Lower',
    },
  ]

  return (
    <>
      <CCard className="mb-4">
        <CCardBody>
          <CRow className="mb-3">
            <CCol sm={6}>
              <h4 id="traffic" className="card-title mb-0">
                Exercise
              </h4>
            </CCol>
            <CCol sm={7} className="d-none d-md-block">
              <CFormSelect
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
              >
                <option value="flat dumbbell press">Flat Dumbbell Press</option>
                <option value="cable fly">Cable Fly</option>
                <option value="lat pulldown">Lat Pulldown</option>
                <option value="overhead cable tricep extension">
                  Overhead Cable Tricep Extension
                </option>
                <option value="machine lateral raise">Machine Lateral Raise</option>
                <option value="high incline smith press">High Incline Smith Press</option>
                <option value="t-bar row">T-Bar Row</option>
                <option value="ez-bar bicep curl">Ez-Bar Bicep Curl</option>
                <option value="cable crunch">Cable Crunch</option>
                <option value="dumbbell romanian deadlift">Dumbbell Romanian Deadlift</option>
                <option value="dumbbell step up">Dumbbell Step Up</option>
                <option value="seated leg press toe-press">Seated Leg Press Toe-Press</option>
                <option value="hack squat">Hack Squat</option>
                <option value="seated leg curl">Seated Leg Curl</option>
                {/* Add more options here as needed */}
              </CFormSelect>
              {/* <CButtonGroup className="float-end me-3">
                {['Day', 'Week', 'Month', 'Year'].map((value) => (
                  <CButton
                    color="outline-secondary"
                    key={value}
                    className="mx-0"
                    active={value === timeFilter}
                    onClick={() => setTimeFilter(value)}
                  >
                    {value}
                  </CButton>
                ))}
              </CButtonGroup> */}
            </CCol>
          </CRow>
          <ProgressionChart data={progressionData} />
          {/* <MainChart timeFilter={timeFilter} splitFilter={splitFilter} /> */}
        </CCardBody>
        <CCardFooter>
          <CRow
            xs={{ cols: 1, gutter: 4 }}
            sm={{ cols: 2 }}
            lg={{ cols: 4 }}
            xl={{ cols: 5 }}
            className="mb-2 text-center"
          >
            {/* {dynamicProgress.map((item, index, items) => (
              <CCol
                style={{ cursor: 'pointer', opacity: splitFilter === item.filterValue ? 1 : 0.5 }}
                className={classNames({
                  'd-none d-xl-block': index + 1 === items.length,
                })}
                key={index}
                onClick={() => {
                  setSplitFilter(splitFilter === item.filterValue ? 'All' : item.filterValue)
                }}
              >
                <div className="text-body-secondary">{item.title}</div>
                <div className="fw-semibold text-truncate">
                  {item.value} ({item.percent}%)
                </div>
                <CProgress thin className="mt-2" color={item.color} value={item.percent} />
              </CCol>
            ))} */}
          </CRow>
        </CCardFooter>
        <CTable align="middle" className="mb-0 border" hover responsive>
          <CTableHead className="text-nowrap">
            <CTableRow>
              <CTableHeaderCell className="bg-body-tertiary">Exercise Log</CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary">Activity</CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {recentExercises.map((item, index) => (
              <CTableRow key={item.id || index}>
                <CTableDataCell>
                  <div className="fw-semibold">{item.exercise_name.toUpperCase()}</div>
                  <div className="small text-body-secondary text-nowrap">
                    {item.weight} lbs × {item.reps} reps (Set {item.set_number})
                  </div>
                </CTableDataCell>
                <CTableDataCell>
                  <div className="small text-body-secondary text-nowrap">Logged on</div>
                  <div className="fw-semibold text-nowrap">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      </CCard>
      <CRow>
        <CCol xs>
          <CCard className="mb-4">
            <CCardHeader>Food</CCardHeader>
            <CCardBody>
              <CRow>
                <CCol xs={12} md={6} xl={6}>
                  {weeklyProgress.length === 0 ? (
                    <div className="text-center text-body-secondary mt-5">
                      <em>No meals logged in the last 7 days.</em>
                    </div>
                  ) : (
                    weeklyProgress.map((item, index) => (
                      <div className="progress-group mb-4" key={index}>
                        <div className="progress-group-prepend">
                          <span className="text-body-secondary small">{item.day}</span>
                        </div>
                        <div className="progress-group-bars">
                          <CProgress thin color="info" value={item.pCal} />
                          <CProgress thin color="danger" value={item.pPro} />
                          <CProgress thin color="warning" value={item.pCarb} />
                          <CProgress thin color="success" value={item.pFat} />
                        </div>
                      </div>
                    ))
                  )}
                </CCol>
                <CCol xs={12} md={6} xl={6}>
                  {dynamicMacros.map((item, index) => (
                    <div className="progress-group" key={index}>
                      <div className="progress-group-header">
                        <CIcon className="me-2" icon={item.icon} size="lg" />
                        <span>{item.title}</span>
                        <span className="ms-auto fw-semibold">
                          {item.value}{' '}
                          <span className="text-body-secondary small">({item.percent}%)</span>
                        </span>
                      </div>
                      <div className="progress-group-bars">
                        <CProgress thin color={item.color} value={item.percent} />
                      </div>
                    </div>
                  ))}
                </CCol>
              </CRow>

              <br />

              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">Food Log</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">
                      <CIcon icon={cilFire} />
                    </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">
                      <CIcon icon={cilBurger} />
                    </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary text-center">
                      <CIcon icon={cilFastfood} />
                    </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">
                      <CIcon icon={cilDrop} />
                    </CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {recentMeals.map((item, index) => (
                    <CTableRow key={item.id || index}>
                      <CTableDataCell>
                        <div className="fw-semibold">
                          {item.food_name.charAt(0).toUpperCase() + item.food_name.slice(1)}
                        </div>
                        <div className="small text-body-secondary text-nowrap">
                          <span>{item.meal_type.toUpperCase()}</span> |{' '}
                          {new Date(item.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </CTableDataCell>
                      <CTableDataCell className="text-center fw-semibold text-danger">
                        {item.calories}
                      </CTableDataCell>
                      <CTableDataCell className="text-center fw-semibold text-info">
                        {item.protein}g
                      </CTableDataCell>
                      <CTableDataCell className="text-center text-warning">
                        {item.carbs}g
                      </CTableDataCell>
                      <CTableDataCell className="text-center text-success">
                        {item.fat}g
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
