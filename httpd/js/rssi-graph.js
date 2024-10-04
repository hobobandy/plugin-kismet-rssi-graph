const MAX_HISTORY_PACKETS = 60;
const RSSI_GRAPH_WEIGHT = -2000;
const RSSI_GRAPH_OPTIONS = {
                            type: "line",
                            maintainAspectRatio: false,
                            responsive: true
                            };

kismet_ui.AddDeviceDetail("rssi-graph", "RSSI Graph (last " + MAX_HISTORY_PACKETS + " packets)", RSSI_GRAPH_WEIGHT, {
    liveupdate: true,
    render: function(data) {
        let container_id = 'rssi_graph_container_' + data["kismet.device.base.key"];
        let rssi_graph_container = $('<div>', { id: container_id, style: "padding:1em;" });
        rssi_graph_container.html('<p>No data yet to generate a graph...</p>');
        $("#rssi-graph", "#detaildialog" + data["kismet.device.base.key"]).html(rssi_graph_container);
    },
    draw: function(data, target, options, storage) {
        // Prepare the chart
        let container_id = 'rssi_graph_container_' + data["kismet.device.base.key"];

        if (!('rssi_graph_canvas' in window[storage])) {
            window[storage].rssi_graph_canvas = $('<canvas>');
        }

        if (!('rssi_chart' in window[storage])) {
            window[storage].rssi_chart = new Chart(window[storage].rssi_graph_canvas, RSSI_GRAPH_OPTIONS);
        }

        if (!('rssi_history' in window[storage])) {
            window[storage].rssi_history = new Array();
        }

        $('#' + container_id, "#detaildialog" + data["kismet.device.base.key"]).html(window[storage].rssi_graph_canvas);

        // Prepare the data to plot
        let rssi_data = new Array();
        let rssi_labels = new Array();
        let rssi_avg_data = new Array();
        let rssi_avg = 0;
        
        let new_item = [data["kismet.device.base.last_time"], data["kismet.device.base.signal"]["kismet.common.signal.last_signal"]];

        if (window[storage].rssi_history.length > 0) {
            let last_item =  window[storage].rssi_history.at(-1);

            // Make sure this is a new value
            if ((last_item[0] != new_item[0]) && (last_item[1] != new_item[1])) {
                window[storage].rssi_history.push(new_item);
            }

            // Keep only the last MAX_HISTORY_PACKETS values (this should be configurable)
            while (window[storage].rssi_history.length > MAX_HISTORY_PACKETS) {
                window[storage].rssi_history.shift();
            }

            window[storage].rssi_history.forEach((item) => {
                rssi_data.push(item[1]);
                rssi_labels.push("-" + Math.ceil((Date.now() - (item[0]*1000))/1000) + "s");
                rssi_avg += item[1];
            });

            rssi_avg = Math.floor(rssi_avg /  window[storage].rssi_history.length);
            rssi_avg_data.length = window[storage].rssi_history.length;
            rssi_avg_data.fill(rssi_avg);
        } else {
            // Initial RSSI History value
            window[storage].rssi_history.push(new_item);
        }

        // Update the chart
        let live_label = 'RSSI';
        let avg_label = 'Avg';
        if (rssi_data.length > 0) {
            live_label += ' (' + rssi_data.at(-1) + ')';
            avg_label += ' (' +  rssi_avg + ')';
        }

        window[storage].rssi_chart.data.datasets = [{
                                        label: live_label,
                                        data: rssi_data,
                                        pointStyle: false,
                                        tension: 0.1
                                    },
                                    {
                                        label: avg_label,
                                        data: rssi_avg_data,
                                        borderDash: [5, 10],
                                        pointStyle: false,
                                        tension: 0.1
                                    }];
        window[storage].rssi_chart.data.labels = rssi_labels;
        window[storage].rssi_chart.resize();
        window[storage].rssi_chart.update('none');
    },
});
