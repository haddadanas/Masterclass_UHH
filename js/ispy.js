/* eslint-disable quotes */
document.addEventListener('DOMContentLoaded', function() {

  ispy.init();
  ispy.addGroups();
  ispy.initLight();
  ispy.initControlPanel();
  ispy.loadWebFiles();
  ispy.run();

  console.log(ispy.event_description);

});
