var database = function () {
    var self = this;
    self.getData = function (monthNum) {
        var data = [
            {
                monthName: 'Jan',
                monthNum: 0,
                year: 2018,
                startingBal: 1200.39,
                transactions: [
                    {
                        transId: 0,
                        transName: 'Walmart',
                        transAmount: '15.90',
                        transType: 'debit',
                        transDate: new Date('1/5/18')
                    },
                    {
                        transId: 1,
                        transName: 'Kroger',
                        transAmount: '1.34',
                        transType: 'debit',
                        transDate: new Date('1/8/18'
                        )
                    },
                    {
                        transId: 2,
                        transName: 'Paycheckblahblahblah',
                        transAmount: '200',
                        transType: 'credit',
                        transDate: new Date('1/15/18')
                    },
                    {
                        transId: 3,
                        transName: 'Coyote\'s',
                        transAmount: '75.23',
                        transType: 'debit',
                        transDate: new Date('1/15/18')
                    },
                ]
            },
            {
                monthName: 'Feb',
                monthNum: 1,
                year: 2018,
                startingBal: 1200.39,
                transactions: [
                    {
                        transId: 0,
                        transName: 'Strippers',
                        transAmount: '315.90',
                        transType: 'debit',
                        transDate: new Date('2/4/18')
                    },
                    {
                        transId: 1,
                        transName: 'Drugs',
                        transAmount: '50.00',
                        transType: 'debit',
                        transDate: new Date('2/11/18')
                    },
                    {
                        transId: 2,
                        transName: 'Alcohol',
                        transAmount: '27.39',
                        transType: 'debit',
                        transDate: new Date('2/13/18')
                    },
                    {
                        transId: 3,
                        transName: 'Munchies',
                        transAmount: '19.89',
                        transType: 'debit',
                        transDate: new Date('2/15/18')
                    },
                ]
            }
        ]
        return data[parseInt(monthNum)];
    }
}

module.exports = database;