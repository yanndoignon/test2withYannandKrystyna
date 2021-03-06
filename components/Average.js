'use strict'

var _ = require('lodash')
var React = require('react')
var numeral = require('numeral')
var Router = require('react-router')
var objectAssign = require('react/lib/Object.assign')
var BarchartEnvelope = require('./BarchartEnvelope')
var Scatterplot = require('./Scatterplot')
var cx = React.addons.classSet

var MapActionCreators = require('../actions/MapActionCreators')
var queryMixin = require('../mixins/queryMixin')
var Store = require('../stores/Store')

var Average = React.createClass({

  displayName: 'Average',

  mixins: [ Router.State, Router.Navigation, queryMixin ],

  componentDidMount() {
    Store.addIndicatorChangeListener(this.handleStoreChange)
    Store.addYearChangeListener(this.handleStoreChange)
    Store.addCountryChangeListener(this.handleStoreChange)

    this.setState({})
  },

  handleStoreChange() {
    this.setState({})
  },

  onCountryClick(countryName) {
    this.updateQuery({country: countryName})
    MapActionCreators.changeSelectedCountry(countryName)
  },

  onCircleClick(d, i) {
    var selected_indicator = Store.getSelectedIndicator()
    var selected_year = this.props.data.global.meta.indicators[selected_indicator].years[i]
    this.updateQuery({year: selected_year})
    MapActionCreators.changeSelectedYear(selected_year)
  },

  render() {
    var average, Chart, countryList, countryChartBody
    var global = this.props.data.global
    var configs = this.props.data.configs
    var selected_indicator = Store.getSelectedIndicator()
    var selected_year = Store.getSelectedYear()
    var selected_country = Store.getSelectedCountry()
    var onCircleClick = this.onCircleClick

    if (!_.isEmpty(selected_indicator) && !_.isEmpty(global)) {
      var indicators = global.data.locations
      // indicator with years
      if (!_.isEmpty(configs) && configs.indicators[selected_indicator].years.length) {
        var selectedIndex = _.indexOf(global.meta.indicators[selected_indicator].years, selected_year)

        countryList = Object.keys(indicators).map(function(countryName, key) {
          var hasData, formattedValue, countryData, countryChart

          if (indicators[countryName][selected_indicator]) {
            formattedValue = numeral(indicators[countryName][selected_indicator].years[selected_year]).format('0.000')
            countryData = _.map(indicators[countryName][selected_indicator].years, function(value) {
              return value || 0
            })

            countryChart = <BarchartEnvelope data={countryData} width={80} height={20} />
            countryChartBody = (
              <div className={(selected_country == countryName ? ' show' : '') + ' detail'}>
                <Scatterplot data={countryData} selectedIndex={selectedIndex} onCircleClick={onCircleClick} />
              </div>
            )

            hasData = true
          } else {
            formattedValue = 'No data'
            countryChartBody = null
            hasData = false
          }

          var classes = cx({
            'countryItem': true,
            'empty': !hasData,
            'active': selected_country == countryName
          })

          return (
            <li key={key} className={classes}>
              <header onClick={this.onCountryClick.bind(this, countryName)}>
                <span className='label'>{global.meta.locations[countryName].label}</span>
                <span className='value'>{formattedValue}</span>
                <span className='chart'>
                  {countryChart}
                </span>
              </header>
              {countryChartBody}
            </li>
          )
        }.bind(this))

        if (global.meta.indicators[selected_indicator].avg) {
          var hasInvalidValue = false
          average = numeral(global.meta.indicators[selected_indicator].avg.years[selected_year]).format('0.000')

          var dataSeries = _.map(global.meta.indicators[selected_indicator].avg.years, function(value) {
            if (!value) {
              hasInvalidValue = true
              console.warn(selected_indicator + ' has invalid data')
            } else {
              return value.toFixed(2)
            }
          })

          if (!hasInvalidValue) Chart = <BarchartEnvelope data={dataSeries} width={80} height={20}/>
        }

      // indicator without years
      } else {
        countryList = Object.keys(indicators).map(function(countryName, key) {
          var countryValue = indicators[countryName][selected_indicator]
          var formattedValue = countryValue ? (numeral(countryValue).format('0.000') + '%') : 'No data'

          var classes = cx({
            'countryItem': true,
            'empty': !countryValue,
            'active': selected_country == countryName
          })

          return (
            <li key={key} className={classes} onClick={this.onCountryClick.bind(this, countryName)}>
              <span className='label'>{global.meta.locations[countryName].label}</span>
              <span className='value'>{formattedValue}</span>
            </li>
          )
        }.bind(this))
        average = numeral(global.meta.indicators[selected_indicator].avg).format('0.000') + '%'
      }

    }

    return (
      <section className='drilldown'>
        <header className='header'>
          <span className='label'>Average</span>
          <span className='value'>{average}</span>
          <span className='chart'>{Chart}</span>
        </header>
        <ul className='list'>
          {countryList}
        </ul>
      </section>
    )
  }

})

module.exports = Average