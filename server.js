const express = require('express')
const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: true }))


const calculateSplit = (obj) => {
    if (
        !obj["ID"] ||
        !obj["Amount"] ||
        !obj["Currency"] ||
        !obj["CustomerEmail"] ||
        !obj["SplitInfo"] 
    ) {
        return 1
    }
    const data = obj
    const split = obj["SplitInfo"]
    let amount = data["Amount"]
    let ratios = 0
    for (let index = 0; index < split.length; index++) {
        if (
            !split[index]["SplitType"] ||
            !split[index]["SplitValue"] ||
            !split[index]["SplitEntityId"]
        ) {
            return 1
        }
        if (split[index]["SplitType"] == 'RATIO')
        {
            ratios += split[index]["SplitValue"]
        }
    }
    const response = {
        "ID": data["ID"],
        "Balance": null,
        "SplitBreakdown": []
    }
    const flat = split.filter(obj => obj["SplitType"] == 'FLAT').map(item => {
        amount -= item["SplitValue"]
        return {
            "SplitEntityId": item["SplitEntityId"],
            "Amount": item["SplitValue"]
        }
    })
    const percentage = split.filter(obj => obj["SplitType"] == 'PERCENTAGE').map(item => {
        const percent = (item["SplitValue"]/100) * amount
        amount -= percent
        return {
            "SplitEntityId": item["SplitEntityId"],
            "Amount": percent

        }
    })
    const ratio = split.filter(obj => obj["SplitType"] == 'RATIO').map(item => {
        const value = (item["SplitValue"]/ratios) * amount
        return {
            "SplitEntityId": item["SplitEntityId"],
            "Amount": value
        }
    })

    if (ratio.length > 0) {
        amount =  0
    }

    response["SplitBreakdown"] = [...flat, ...percentage, ...ratio]
    response["Balance"] = amount
    return response

}


app.post("/split-payment/compute", (req, res) => {
    const result = calculateSplit(req.body)
    if (result == 1) {
        res.status(400).send("Incomplete post body fields")
    }
    res.json(result)
})

app.get("/", (req, res) => {
    res.send("Welcome to this Server")
})

let PORT = process.env.PORT || 8080

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})