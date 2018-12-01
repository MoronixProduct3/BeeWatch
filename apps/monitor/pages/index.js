const electron = require('electron');
const fs = require('fs');
const equal = require('deep-equal');

var card = fs.readFileSync('pages/cards.html', { encoding: 'utf8' });
var loader = fs.readFileSync('pages/loader.html', { encoding: 'utf8' });

var interfaceListSaved = [];
var currentInterfaceSaved;

// Wait for data reception
electron.ipcRenderer.on('slave-list', (event, slaveList) => {
    if (slaveList && slaveList.length > 0) {
        untouched = false;
        cardsHtlml = "";
        slaveList.forEach((slave) => { cardsHtlml += card; })
        document.getElementById('mosaic-tab').innerHTML = cardsHtlml;

        // Updating the values of every element
        cards = document.getElementsByClassName('hive-card');

        for(let index = 0; index < cards.length; ++index){
            
            // Updating id
            cards.item(index).id = `hive-${slaveList[index].id}`;
            cards.item(index).getElementsByClassName('card-id').item(0).innerHTML =
                slaveList[index].id;

            // Updating temperature
            cards.item(index).getElementsByClassName('card-temp').item(0).innerHTML =
                slaveList[index].temperature;

            // Updating connexion status
            cards.item(index).getElementsByClassName('card-signal').item(0).innerHTML =
                slaveList[index].connectionActive ? 'signal_wifi_4_bar' : 'signal_wifi_off';

            // Updating position
            cards.item(index).getElementsByClassName('card-position').item(0).innerHTML =
                `${Math.abs(slaveList[index].latitude)}°${slaveList[index].latitude >= 0 ? 'N':'S'} \
                ${Math.abs(slaveList[index].longitude)}°${slaveList[index].longitude >= 0 ? 'E':'W'}`;
            
            // Updating actuator
            let checkbox = cards.item(index).getElementsByClassName('card-actuator').item(0);
            checkbox.checked = slaveList[index].actuatorEnabled;
            checkbox.onclick = ()=>{
                checkbox.disabled = true;
                console.log(slaveList)
                electron.ipcRenderer.send('actuator-order', slaveList[index].id, checkbox.checked)
            }

            // Updating motion sensor
            cards.item(index).getElementsByClassName('card-motion').item(0).innerHTML = 
                slaveList[index].movement ? 'directions_walk' : 'visibility_off';
            cards.item(index).getElementsByClassName('card-motion').item(0).style.color =
                slaveList[index].movement ? 'red' : 'black';
        }
    }
    else
    {
        document.getElementById('mosaic-tab').innerHTML = loader;
        document.getElementById('map-tab').innerHTML = loader;
    }
});

electron.ipcRenderer.on('interface-list', (event, interfaceList, current) => {
    
    // Only execute if the selection has changed
    if (!(equal(interfaceList, interfaceListSaved) && equal(current, currentInterfaceSaved)))
    {
        let selector = document.createElement("select");

        if(interfaceList.length <= 0)
        {
            let element = document.createElement("option");
            element.disabled = true;
            element.setAttribute('selected',true)
            element.appendChild(document.createTextNode("No interface available"));
            selector.appendChild(element);           
        }
        else
        {
            interfaceList.forEach((interface)=>{
                let element = document.createElement("option");
                if (current.comName == interface.comName)
                    element.setAttribute('selected',true);
                element.appendChild(document.createTextNode(`${interface.name} (${interface.comName})`));
                selector.appendChild(element);
            })
        }

        let container = document.getElementById("interface-selector");
        container.replaceChild(selector, container.childNodes[1])

        var elems = document.querySelectorAll('select');
        M.FormSelect.init(elems, {});
    }

    interfaceListSaved = interfaceList;
    currentInterfaceSaved = current;
})

// Instruct the main process to start sending data
window.onload = ()=>{
    electron.ipcRenderer.send('main-window-ready');
}