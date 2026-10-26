import React, { useState, useEffect } from 'react'

import {
  CCard,
  CCardBody,
  CCardFooter,
  CCol,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CFormInput,
  CModalBody,
  CDropdown,
  CDropdownToggle,
  CListGroup,
  CListGroupItem,
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

  const [visible, setVisible] = useState(false)

  const [searchTerm, setSearchTerm] = useState('')

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
          const dateKey = new Date(meal.created_at).toLocaleDateString('en-US', {
            weekday: 'long',
            timeZone: 'America/Chicago',
          })
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
              <CDropdown>
                <CDropdownToggle
                  color="secondary"
                  onClick={() => setVisible(true)}
                  className="text-capitalize"
                >
                  {selectedExercise || 'Select Exercise'}
                </CDropdownToggle>
              </CDropdown>
              {/* <CSearchButton
                onTrigger={() => setVisible(true)}
                aria-label="Open search dialog"
                aria-controls="search-button-modal"
                shortcut="meta+/,ctrl+/"
              /> */}
              <CModal
                visible={visible}
                onClose={() => {
                  setVisible(false)
                  setSearchTerm('')
                }}
                aria-labelledby="search-button-modal-title"
              >
                <CModalHeader>
                  <CModalTitle id="search-button-modal-title" className="w-100">
                    <CFormInput
                      type="search"
                      placeholder="Search"
                      aria-label="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      autoFocus
                    />
                  </CModalTitle>
                </CModalHeader>
                <CModalBody
                  style={{
                    maxHeight: '400px',
                    overflowY: 'auto',
                  }}
                >
                  <CListGroup flush className="text-white">
                    {[
                      'cuffed behind-the-back lateral raise',
                      'cross-body lat pull-around',
                      'low incline smith machine press',
                      'chest-supported machine row',
                      'overhead cable tricep extensions (bar)',
                      'straight-bar lat prayer',
                      'pec deck (with integrated partials)',
                      'seated leg curl',
                      'machine hip adduction',
                      'hack squat',
                      'leg extension',
                      'leg press calf press',
                      'super-rom overhand cable row',
                      'machine shoulder press',
                      'assisted pull-up',
                      'paused assisted dip',
                      'inverse dumbbell zottman curl',
                      'super-rom dumbbell lateral raise',
                      'cable reverse fly (mechanical dropset on all sets)',
                      'lying leg curl',
                      'leg press',
                      'paused barbell rdl',
                      'sissy squat',
                      'seated calf raise',
                      'bayesian cable curl',
                      'seated dumbbell french press',
                      'bottom-2/3 constant tension preacher curl',
                      'cable triceps kickback',
                      'cable crunch',
                      'lat-focused cable row',
                      'low incline dumbbell press',
                      'machine chest-supported row + kelso shrug',
                      'bent-over cable pec flye (w/ integrated partials)',
                      '1-arm lat pull-in',
                      'dual-cable triceps press',
                      'smith machine squat',
                      'dumbbell calf jumps',
                      'dual-handle lat pulldown (mid-back + lats)',
                      'seated dumbbell shoulder press',
                      'decline machine chest press',
                      'concentration cable curl',
                      'cross-body cable y-raise',
                      'rear delt 45 degrees cable flye',
                      'smith machine reverse lunge',
                      'glute-ham raise',
                      'machine hip abduction',
                      'slow-eccentric ez-bar skull crusher',
                      'slow-eccentric bayesian curl',
                      'tricep diverging pressdown (long rope or 2 ropes)',
                      'reverse grip cable curl',
                      'roman chair leg raise',
                      'machine lateral raise',
                      'dumbbell lateral raise',
                      'smith machine shoulder press',
                      'standing dumbbell arnold press',
                      'cable lat prayer',
                      'dumbbell lat pullover',
                      'machine lat pullover',
                      'elbows-in 1-arm dumbbell row',
                      'half-kneeling 1-arm lat pulldown',
                      'reverse nordics',
                      'single-leg leg press',
                      'cable hip abduction',
                      'lateral band walk',
                      'barbell hip thrust',
                      'single-leg dumbbell hip thrust',
                      'low incline dumbbell flye',
                      'low-to-high cable crossover',
                      'chest press machine (incline or flat)',
                      'dumbbell chest press (incline or flat)',
                      'plate loaded neck curls',
                      'head harness neck extension',
                      'plate-loaded neck extension',

                      // // Phase 1 Upper 1
                      // 'cuffed behind-the-back lateral raise',
                      // 'cross-body lat pull-around',
                      // 'low incline smith machine press',
                      // 'chest-supported machine row',
                      // 'overhead cable tricep extensions (bar)',
                      // 'straight-bar lat prayer',
                      // 'pec deck (with integrated partials)',
                      // // Phase 1 Lower 1
                      // 'seated leg curl',
                      // 'machine hip adduction',
                      // 'hack squat',
                      // 'leg extension',
                      // 'leg press calf press',
                      // // Phase 1 Upper 2
                      // 'super-rom overhand cable row',
                      // 'machine shoulder press',
                      // 'assisted pull-up',
                      // 'paused assisted dip',
                      // 'inverse dumbbell zottman curl',
                      // 'super-rom dumbbell lateral raise',
                      // 'cable reverse fly (mechanical dropset)',
                      // // Phase 1 Lower 2
                      // 'lying leg curl',
                      // 'leg press',
                      // 'paused barbell rdl',
                      // 'sissy squat',
                      // 'seated calf raise',
                      // // Phase 1 Arms
                      // 'bayesian cable curl',
                      // 'seated dumbbell french press',
                      // 'bottom-2/3 constant tension preacher curl',
                      // 'cable triceps kickback',
                      // 'cable crunch',
                      // // Phase 2 Upper 1
                      // 'lat-focused cable row',
                      // 'low incline dumbbell press',
                      // 'machine chest-supported row + kelso shrug',
                      // 'bent-over cable pec flye (w/ integrated partials)',
                      // '1-arm lat pull-in',
                      // 'dual-cable triceps press',
                      // // Phase 2 Lower 1
                      // 'smith machine squat',
                      // 'dumbbell calf jumps',
                      // // Phase 2 Upper 2
                      // 'dual-handle lat pulldown (mid-back + lats)',
                      // 'seated dumbbell shoulder press',
                      // 'decline machine chest press',
                      // 'concentration cable curl',
                      // 'cross-body cable y-raise',
                      // 'rear delt 45 degrees cable flye',
                      // // Phase 2 Lower 2
                      // 'smith machine reverse lunge',
                      // 'glute-ham raise',
                      // 'machine hip abduction',
                      // // Phase 2 Arms
                      // 'slow-eccentric ez-bar skull crusher',
                      // 'slow-eccentric bayesian curl',
                      // 'triceps diverging pressdown (long rope or 2 ropes)',
                      // 'reverse grip cable curl',
                      // 'roman chair leg raise',
                      // // Weakpoints
                      // 'machine lateral raise',
                      // 'dumbbell lateral raise',
                      // 'smith machine shoulder press',
                      // 'standing dumbbell arnold press',
                      // 'cable lat prayer',
                      // 'dumbbell lat pullover',
                      // 'machine lat pullover',
                      // 'elbows-in 1-arm db row',
                      // 'half-kneeling 1-arm lat pulldown',
                      // 'reverse nordics',
                      // 'single-leg leg press',
                      // 'cable hip abduction',
                      // 'lateral band walk',
                      // 'barbell hip thrust',
                      // 'single-leg dumbbell hip thrust',
                      // 'low incline dumbbell flye',
                      // 'low-to-high cable crossover',
                      // 'chest press machine (incline if upper pecs lagging)',
                      // 'dumbbell chest press (incline if upper pecs lagging)',
                      // 'plate-loaded neck curls',
                      // 'head harness neck extension',
                      // 'plate-loaded neck extension',
                    ]
                      .filter((ex) => ex.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((exercise, idx) => (
                        <CListGroupItem
                          key={idx}
                          as="button"
                          type="button"
                          active={selectedExercise === exercise}
                          className="d-flex justify-content-between align-items-center text-capitalize text-white"
                          onClick={() => {
                            setSelectedExercise(exercise)
                            setVisible(false)
                            setSearchTerm('')
                          }}
                        >
                          {exercise}
                        </CListGroupItem>
                      ))}
                  </CListGroup>
                </CModalBody>
              </CModal>
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
