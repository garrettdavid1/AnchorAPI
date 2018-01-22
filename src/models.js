modelHandler = (function () {
    var ModelContainer = function(){
        var self = this;
        self.monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        self.month = function(month, year){
            return {
                'monthName': self.monthNames[month],
                'monthNum': month,
                'year': year,
                'startingBal': 0,
                'endingBal': 0,
                'transTotal': 0,
                'transactions': []
            }
        }
    }

    var modelContainer;

    return {
        init: function(){
            modelContainer = new ModelContainer();
        },
        month: function (month, year) {
            return modelContainer.month(month, year);
        },
        getMonthName: function(monthNum){
            return modelContainer.monthNames[monthNum];
        }
    }
})();

module.exports = modelHandler;