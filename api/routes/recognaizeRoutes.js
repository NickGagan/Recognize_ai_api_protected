module.exports = function(app) {
    const getMentalHealthController = require('../controllers/get_mental_health_state_controller');
    
    app.route('/health_reddit')
    .post(getMentalHealthController.getMentalHealthState);
    
    app.route('/health_text')
      .post(getMentalHealthController.getMentalHealthStateFromBody);

};