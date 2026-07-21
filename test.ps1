$body = @{
    event = "call_ended"
    call = @{
        agent_id = "agent_1acf0831608f99ab3c87a7052b"
        recording_url = "test_url"
        duration_ms = 15000
    }
}
$json = $body | ConvertTo-Json -Depth 5
Invoke-RestMethod -Uri "https://fili-scarlett-crm.onrender.com/webhook/estado-llamada" -Method Post -Body $json -ContentType "application/json"
$result = Invoke-RestMethod -Uri "https://fili-scarlett-crm.onrender.com/api/llamadas"
$result | ConvertTo-Json -Depth 5
