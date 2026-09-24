import React, { useState, useEffect } from 'react'

import {
  CCard,
  CCardBody,
  CCardFooter,
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
import { cilFire, cilBurger, cilFastfood, cilDrop, cilDelete } from '@coreui/icons'
import ProgressionChart from './ProgressionChart'
import { supabase } from '../../supabaseClient.js'
import Model from 'react-body-highlighter'

const Dashboard = () => {
  // ALL STATE MUST BE INSIDE THE COMPONENT!
  const [recentExercises, setRecentExercises] = useState([])
  const [weeklyTotals, setWeeklyTotals] = useState({})
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const [macroTargets, setMacroTargets] = useState({
    calories: 2500,
    protein: 150,
    carbs: 200,
    fat: 65,
  })

  const [profileStats, setProfileStats] = useState({
    weight: 0,
    smm: 0,
    bmi: 0,
    pbf: 0,
    segmental: [0, 0, 0, 0],
    created_at: null,
  })

  const handleDeleteMeal = async (id) => {
    const { error } = await supabase.from('food_logs').delete().eq('id', id)

    if (!error) {
      setRecentMeals(recentMeals.filter((meal) => meal.id !== id))
    } else {
      console.error('Supabase error deleting meal:', error)
    }
  }

  const handleDeleteExercise = async (id) => {
    const { error } = await supabase.from('exercise_logs').delete().eq('id', id)

    if (!error) {
      setRecentExercises(recentExercises.filter((ex) => ex.id !== id))
    } else {
      console.error('Supabase error deleting exercise:', error)
    }
  }

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
    async function fetchUserProfile() {
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)

      if (!profileError && profileData && profileData.length > 0) {
        setMacroTargets({
          calories: profileData[0].target_calories,
          protein: profileData[0].target_protein,
          carbs: profileData[0].target_carbs,
          fat: profileData[0].target_fat,
        })

        setProfileStats({
          weight: profileData[0].current_weight_lbs || 0,
          smm: profileData[0].skeletal_muscle_mass || 0,
          bmi: profileData[0].bmi || 0,
          pbf: profileData[0].body_fat_percentage || 0,
          segmental: profileData[0].segmental_lean_data || [0, 0, 0, 0],
          created_at: profileData[0].created_at,
        })
      } else if (profileError) {
        console.error('Error fetching profile:', profileError)
      }
    }

    async function fetchProgression() {
      const { data } = await supabase
        .from('exercise_logs')
        .select('created_at, weight, reps')
        .eq('exercise_name', selectedExercise)
        .order('created_at', { ascending: true })
      if (data) setProgressionData(data)
    }
    async function fetchDashboardStats() {
      const startOfDay = new Date(`${selectedDate}T00:00:00-05:00`).toISOString()
      const endOfDay = new Date(`${selectedDate}T23:59:59-05:00`).toISOString()
      const { data, error } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('exercise_name', selectedExercise)
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: true })

      if (!error && data) {
        setRecentExercises(data.slice(0, 6))
      }
    }

    async function fetchFoodLogs() {
      const startOfDay = new Date(`${selectedDate}T00:00:00-05:00`).toISOString()
      const endOfDay = new Date(`${selectedDate}T23:59:59-05:00`).toISOString()
      const { data: mealData, error: mealError } = await supabase
        .from('food_logs')
        .select('*')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('created_at', { ascending: false })

      if (!mealError && mealData) {
        console.log('Fetched Meals:', mealData)
        setRecentMeals(mealData.slice(0, 6))

        // const todaysMeals = mealData.filter((meal) => {
        //   const mealDate = new Date(meal.created_at)
        //   return mealDate >= today
        // })

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
    fetchUserProfile()

    const interval = setInterval(() => {
      fetchDashboardStats()
      fetchFoodLogs()
      fetchWeeklyFoodLogs()
      fetchUserProfile()
      fetchProgression()
    }, 5000)

    return () => clearInterval(interval)
  }, [selectedExercise, selectedDate])

  const dynamicMacros = [
    {
      title: 'Calories',
      icon: cilFire,
      percent: Math.min(Math.round((dailyTotals.calories / macroTargets.calories) * 100) || 0, 100),
      value: `${Math.round(dailyTotals.calories)} / ${Math.round(macroTargets.calories)}`,
      color: 'info',
    },
    {
      title: 'Protein',
      icon: cilBurger,
      percent: Math.min(Math.round((dailyTotals.protein / macroTargets.protein) * 100) || 0, 100),
      value: `${Math.round(dailyTotals.protein)}g / ${Math.round(macroTargets.protein)}g`,
      color: 'danger',
    },
    {
      title: 'Carbohydrates',
      icon: cilFastfood,
      percent: Math.min(Math.round((dailyTotals.carbs / macroTargets.carbs) * 100) || 0, 100),
      value: `${Math.round(dailyTotals.carbs)}g / ${Math.round(macroTargets.carbs)}g`,
      color: 'warning',
    },
    {
      title: 'Fat',
      icon: cilDrop,
      percent: Math.min(Math.round((dailyTotals.fat / macroTargets.fat) * 100) || 0, 100),
      value: `${Math.round(dailyTotals.fat)}g / ${Math.round(macroTargets.fat)}g`,
      color: 'success',
    },
  ]

  return (
    <>
      <CRow className="mb-3 text-white">
        <CCol xs={12}>
          <label></label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="form-control bg-dark text-white border-secondary"
          />
        </CCol>
      </CRow>
      <CCard className="mb-4 bg-dark text-white" style={{ borderColor: '#333' }}>
        <CCardBody>
          <CRow className="mb-3 gap-2">
            <CCol xs={12} sm={6}>
              <h4 id="traffic" className="card-title mb-0">
                Exercise
              </h4>
            </CCol>
            <CCol xs={12} sm={7}>
              <CFormSelect
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="text-white"
              >
                {/* Phase 1 */}
                <option label="Phase 1 Upper 1" disabled="true">
                  Phase 1 Upper 1
                </option>
                <option value="cuffed behind-the-back lateral raise">
                  Cuffed Behind-The-Back Lateral Raise
                </option>
                <option value="cross-body lat pull-around">Cross-Body Lat Pull-Around</option>
                <option value="low incline smith machine press">
                  Low Incline Smith Machine Press
                </option>
                <option value="chest-supported machine row">Chest-Supported Machine Row</option>
                <option value="overhead cable tricep extensions (bar)">
                  Overhead Cable Tricep Extensions (Bar)
                </option>
                <option value="straight-bar lat prayer">Straight-Bar Lat Prayer</option>
                <option value="pec deck (with integrated partials)">
                  Pec Deck (With Integrated Partials)
                </option>
                <option label="Phase 1 Lower 1" disabled="true">
                  Phase 1 Lower 1
                </option>
                <option value="seated leg curl">Seated Leg Curl</option>
                <option value="machine hip adduction">Machine Hip Adduction</option>
                <option value="hack squat">Hack Squat</option>
                <option value="leg extension">Leg Extension</option>
                <option value="leg press calf press">Leg Press Calf Press</option>
                <option label="Phase 1 Upper 2" disabled="true">
                  Phase 1 Upper 2
                </option>
                <option value="super-rom overhand cable row">Super-Rom Overhand Cable Row</option>
                <option value="machine shoulder press">Machine Shoulder Press</option>
                <option value="assisted pull-up">Assisted Pull-Up</option>
                <option value="paused assisted dip">Paused Assisted Dip</option>
                <option value="inverse dumbbell zottman curl">Inverse Dumbbell Zottman Curl</option>
                <option value="super-rom dumbbell lateral raise">
                  Super-Rom Dumbbell Lateral Raise
                </option>
                <option value="cable reverse fly (mechanical dropset)">
                  Cable Reverse Fly (Mechanical Dropset)
                </option>
                <option label="Phase 1 Lower 2" disabled="true">
                  Phase 1 Lower 2
                </option>
                <option value="lying leg curl">Lying Leg Curl</option>
                <option value="leg press">Leg Press</option>
                <option value="paused barbell rdl">Paused Barbell Rdl</option>
                {/* Machine Hip Adduction */}
                <option value="sissy squat">Sissy Squat</option>
                <option value="seated calf raise">Seated Calf Raise</option>
                <option label="Phase 1 Arms" disabled="true">
                  Phase 1 Arms
                </option>
                <option value="bayesian cable curl">Bayesian Cable Curl</option>
                <option value="seated dumbbell french press">Seated Dumbbell French Press</option>
                <option value="bottom-2/3 constant tension preacher curl">
                  bottom-2/3 constant tension preacher curl
                </option>
                <option value="cable triceps kickback">cable triceps kickback</option>
                <option value="cable crunch">cable crunch</option>
                {/* PHASE 2 */}
                <option label="Phase 2 Upper 1" disabled="true">
                  Phase 2 Upper 1
                </option>
                <option value="lat-focused cable row">Lat-Focused Cable Row</option>
                <option value="low incline dumbbell press">Low Incline Dumbbell Press</option>
                <option value="machine chest-supported row + kelso shrug">
                  Machine Chest-Supported Row + Kelso Shrug
                </option>
                <option value="bent-over cable pec flye (w/ integrated partials)">
                  Bent-Over Cable Pec Flye (w/ Integrated Partials)
                </option>
                <option value="1-arm lat pull-in">1-Arm Lat Pull-In</option>
                <option value="dual-cable triceps press">Dual-Cable Triceps Press</option>
                <option label="Phase 2 Lower 1" disabled="true">
                  Phase 2 Lower 1
                </option>
                {/* # "seated leg curl" */}
                {/* # "machine hip adduction" */}
                <option value="smith machine squat">Smith Machine Squat</option>
                {/* # "leg extension" */}
                <option value="dumbbell calf jumps">Dumbbell Calf Jumps</option>
                <option label="Phase 2 Upper 2" disabled="true">
                  Phase 2 Upper 2
                </option>
                <option value="dual-handle lat pulldown (mid-back + lats)">
                  Dual-Handle Lat Pulldown (Mid-Back + Lats)
                </option>
                <option value="seated dumbbell shoulder press">
                  Seated Dumbbell Shoulder Press
                </option>
                {/* # "chest-supported machine row" */}
                <option value="decline machine chest press">Decline Machine Chest Press</option>
                <option value="concentration cable curl">Concentration Cable Curl</option>
                <option value="cross-body cable y-raise">Cross-Body Cable Y-Raise</option>
                <option value="rear delt 45 degrees cable flye">
                  Rear Delt 45 Degrees Cable Flye
                </option>
                <option label="Phase 2 Lower 2" disabled="true">
                  Phase 2 Lower 2
                </option>
                {/* # "lying leg curl" */}
                <option value="smith machine reverse lunge">Smith Machine Reverse Lunge</option>
                <option value="glute-ham raise">Glute-Ham Raise</option>
                {/* # "machine hip adduction" */}
                <option value="machine hip abduction">Machine Hip Abduction</option>
                {/* # "standing calf raise" */}
                <option label="Phase 2 Arms" disabled="true">
                  Phase 2 Arms
                </option>
                <option value="slow-eccentric ez-bar skull crusher">
                  Slow-Eccentric Ez-Bar Skull Crusher
                </option>
                <option value="slow-eccentric bayesian curl">Slow-Eccentric Bayesian Curl</option>
                <option value="triceps diverging pressdown (long rope or 2 ropes)">
                  Triceps Diverging Pressdown (Long Rope or 2 Ropes)
                </option>
                <option value="reverse grip cable curl">Reverse Grip Cable Curl</option>
                <option value="roman chair leg raise">Roman Chair Leg Raise</option>
                {/* WEAK POINTS */}
                <option label="Weakpoints" disabled="true">
                  Weakpoints
                </option>
                <option label="   Shoulders" disabled="true">
                  Shoulders
                </option>
                <option value="machine lateral raise">Machine Lateral Raise</option>
                <option value="dumbbell lateral raise">Dumbbell Lateral Raise</option>
                <option value="smith machine shoulder press">Smith Machine Shoulder Press</option>
                <option value="standing dumbbell arnold press">
                  Standing Dumbbell Arnold Press
                </option>
                <option label="   Lats" disabled="true">
                  Lats
                </option>
                <option value="cable lat prayer">Cable Lat Prayer</option>
                <option value="dumbbell lat pullover">Dumbbell Lat Pullover</option>
                <option value="machine lat pullover">Machine Lat Pullover</option>
                <option value="elbows-in 1-arm db row">Elbows-In 1-Arm Dumbbell Row</option>
                <option value="half-kneeling 1-arm lat pulldown">
                  Half-Kneeling 1-Arm Lat Pulldown
                </option>
                <option label="   Quads" disabled="true">
                  Quads
                </option>
                <option value="reverse nordics">Reverse Nordics</option>
                <option value="single-leg leg press">Single-Leg Leg Press</option>
                <option label="   Glutes" disabled="true">
                  Glutes
                </option>
                <option value="cable hip abduction">Cable Hip Abduction</option>
                <option value="lateral band walk">Lateral Band Walk</option>
                <option value="barbell hip thrust">Barbell Hip Thrust</option>
                <option value="single-leg dumbbell hip thrust">
                  Single-Leg Dumbbell Hip Thrust
                </option>
                <option label="   Chest" disabled="true">
                  Chest
                </option>
                <option value="low incline dumbbell flye">Low Incline Dumbbell Flye</option>
                <option value="low-to-high cable crossover">Low-To-High Cable Crossover</option>
                <option value="chest press machine (incline if upper pecs lagging)">
                  Chest Press Machine (Incline If Upper Pecs Lagging)
                </option>
                <option value="dumbbell chest press (incline if upper pecs lagging)">
                  Dumbbell Chest Press (Incline If Upper Pecs Lagging)
                </option>
                <option label="   Neck" disabled="true">
                  Neck
                </option>
                <option value="plate-loaded neck curls">Plate-Loaded Neck Curls</option>
                <option value="head harness neck extension">Head Harness Neck Extension</option>
                <option value="plate-loaded neck extension">Plate-Loaded Neck Extension</option>
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
        <CCardBody>
          <CTable
            align="middle"
            className="mb-0 border border-secondary"
            hover
            responsive
            color="dark"
          >
            <CTableHead className="text-nowrap">
              <CTableRow>
                <CTableHeaderCell className="bg-black text-white">Set Log</CTableHeaderCell>
                <CTableHeaderCell className="bg-black text-white">Date</CTableHeaderCell>
                <CTableHeaderCell className="bg-black text-white"></CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {recentExercises.map((item, index) => (
                <CTableRow key={item.id || index}>
                  <CTableDataCell>
                    <div className="fw-semibold text-white">{item.exercise_name.toUpperCase()}</div>
                    <div className="small text-light text-nowrap">
                      {item.weight} lbs × {item.reps} reps (Set {item.set_number})
                    </div>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="small text-light text-nowrap">Logged on</div>
                    <div className="fw-semibold text-white text-nowrap">
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell>
                    <div className="small text-white text-nowrap">
                      <CIcon
                        icon={cilDelete}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleDeleteExercise(item.id)}
                      />
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCardBody>
      </CCard>
      <CRow>
        <CCol xs>
          <CCard className="mb-4" color="dark">
            <CCardBody>
              <CRow>
                <CCol xs={12} sm={6}>
                  <h4 id="traffic" className="card-title mb-0 text-white">
                    Food
                  </h4>
                </CCol>
                <CCardBody>
                  <CRow>
                    <CCol xs={12} md={6} xl={6}>
                      {weeklyProgress.length === 0 ? (
                        <div className="text-center mt-5 text-white">
                          <em>No meals logged in the last 7 days.</em>
                        </div>
                      ) : (
                        weeklyProgress.map((item, index) => (
                          <div className="progress-group mb-4" key={index}>
                            <div className="progress-group-prepend">
                              <span className="text-white small">{item.day}</span>
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
                            <CIcon className="me-2 text-white" icon={item.icon} size="lg" />
                            <span className="text-white">{item.title}</span>
                            <span className="ms-auto fw-semibold text-white">
                              {item.value}{' '}
                              <span className="small text-white">({item.percent}%)</span>
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

                  <CTable
                    align="middle"
                    className="mb-0 border border-secondary"
                    hover
                    responsive
                    color="dark"
                  >
                    <CTableHead className="text-nowrap">
                      <CTableRow>
                        <CTableHeaderCell className="bg-black text-white">
                          Food Log
                        </CTableHeaderCell>
                        <CTableHeaderCell className="bg-black text-center">
                          <CIcon icon={cilFire} />
                        </CTableHeaderCell>
                        <CTableHeaderCell className="bg-black">
                          <CIcon icon={cilBurger} />
                        </CTableHeaderCell>
                        <CTableHeaderCell className="bg-black text-center">
                          <CIcon icon={cilFastfood} />
                        </CTableHeaderCell>
                        <CTableHeaderCell className="bg-black">
                          <CIcon icon={cilDrop} />
                        </CTableHeaderCell>
                        <CTableHeaderCell className="bg-black"></CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {recentMeals.map((item, index) => (
                        <CTableRow key={item.id || index}>
                          <CTableDataCell>
                            <div className="fw-semibold">
                              {item.food_name.charAt(0).toUpperCase() + item.food_name.slice(1)}
                            </div>
                            <div className="small text-white text-nowrap">
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
                          <CTableDataCell>
                            <CIcon
                              icon={cilDelete}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleDeleteMeal(item.id)}
                            />
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </CCardBody>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CRow>
        <CCol xs>
          <CCard className="mb-4 bg-dark border-secondary">
            <CCardBody>
              <CRow>
                <CCol xs={12}>
                  <h4 id="body-comp" className="card-title mb-4 text-white">
                    Body Composition -{' '}
                    {profileStats.created_at
                      ? new Date(profileStats.created_at).toLocaleDateString()
                      : 'Loading...'}
                  </h4>
                </CCol>
              </CRow>

              <CRow className="align-items-center text-center text-white mt-3">
                {/* Left Side of Screen (Person's Right Limbs) */}
                <CCol xs={4}>
                  <div className="mb-5">
                    <div className="text-secondary small text-uppercase fw-semibold">Right Arm</div>
                    <div className="fw-bold fs-5 text-info">{profileStats.segmental[1]}%</div>
                  </div>
                  <div>
                    <div className="text-secondary small text-uppercase fw-semibold">Right Leg</div>
                    <div className="fw-bold fs-5 text-info">{profileStats.segmental[3]}%</div>
                  </div>
                </CCol>

                {/* Center SVG Model */}
                <CCol xs={4} className="d-flex justify-content-center">
                  <Model
                    data={[]}
                    style={{ width: '12rem' }}
                    bodyColor="#4a4a4a" // Matches your dark theme[cite: 1]
                  />
                </CCol>

                {/* Right Side of Screen (Person's Left Limbs) */}
                <CCol xs={4}>
                  <div className="mb-5">
                    <div className="text-secondary small text-uppercase fw-semibold">Left Arm</div>
                    <div className="fw-bold fs-5 text-info">{profileStats.segmental[0]}%</div>
                  </div>
                  <div>
                    <div className="text-secondary small text-uppercase fw-semibold">Left Leg</div>
                    <div className="fw-bold fs-5 text-info">{profileStats.segmental[2]}%</div>
                  </div>
                </CCol>
              </CRow>

              <hr className="border-secondary mt-5 mb-4" />

              {/* Bottom Core Metrics Grid */}
              <CRow className="text-center text-white pb-2">
                <CCol xs={4}>
                  <div className="text-secondary small text-uppercase fw-semibold">Weight</div>
                  <div className="fw-bold fs-6">{profileStats.weight} lbs</div>
                </CCol>
                <CCol xs={4}>
                  <div className="text-secondary small text-uppercase fw-semibold">
                    Muscle (SMM)
                  </div>
                  <div className="fw-bold fs-6">{profileStats.smm} lbs</div>
                </CCol>
                <CCol xs={4}>
                  <div className="text-secondary small text-uppercase fw-semibold">
                    Percent Body Fat (PBF)
                  </div>
                  <div className="fw-bold fs-6">{profileStats.pbf}</div>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Dashboard
