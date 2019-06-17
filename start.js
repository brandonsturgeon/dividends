let _modPath;

const scope = GetRootScope()

const log = message => Helpers.ConsoleInfo(`[MOD] Dividends: ${message}`)

const notify = notification => GetRootScope().addNotification(notification)

const addTransactionForDividend = dividend => {
	const { competitorName, competitorDividends } = dividend

	const transactionName = `Dividend Payout from ${competitorName}`

	Game.Lifecycle.$rootScope.addTransaction(transactionName, competitorDividends)
}

const calculateDividendsForCompetitor = competitor => {
	const { controlled, growth, history, ownedStocks, stockVolume, name } = competitor

	if (controlled) {
		return 0
	}

	if (ownedStocks === 0) {
		return 0
	}

	/* Stock price change over the last day */
	const length = history.length
	const priceDelta = history[length - 1].stockPrice - history[length - 2].stockPrice

	const dividends = priceDelta * ownedStocks

	return dividends
}

const calculateDividends = competitors => {
	const dividends = []

	for (let i = 0; i < competitors.length; i++) {
		const competitor = competitors[i]

		const competitorName = competitor.name

		const competitorDividends = calculateDividendsForCompetitor(competitor)

		log(`Calculating Dividends for ${competitorName} : ${competitorDividends}`)

		if (competitorDividends <= 0) {
			continue
		}

		const dividend = { competitorName, competitorDividends }

		dividends.push(dividend)
	}

	return dividends
}

const processDividends = dividends => {
	for (let i = 0; i < dividends.length; i++) {
		const companyDividend = dividends[i]

		const { competitorName, competitorDividends } = companyDividend

		log(`${competitorName} : ${competitorDividends}`)

		if(competitorDividends > 0) {
			log(`Processing dividends for ${competitorName}`)

			addTransactionForDividend(companyDividend)
			scope.settings.balance += competitorDividends
		}
	}
}

const eachDay = () => {
	Helpers.UpdateCompetitors()

	notify("Receiving dividends...")

	const competitors = scope.settings.competitorProducts;

	const dividends = calculateDividends(competitors)

	processDividends(dividends)
}

exports.initialize = modPath => {
	modPath = modPath

	log("Initializing")

	const firstLoad = !scope.options.dividendsMod

	if (firstLoad) {
		log("Adding Dividends Mod options on first load")
		scope.options.dividendsMod = { growthModifier: 100000 }
		scope.saveOptions()
	}
}

exports.onNewDay = () => eachDay()

exports.onLoadGame = settings => {
	GetRootScope().sendMail("Dividends loaded!")
}

exports.onUnsubscribe = done => {
  delete scope.options.dividendsMod
  scope.saveOptions()
  done()
}