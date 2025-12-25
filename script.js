
let fileInput = document.querySelector('#file');
let handleSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("image", fileInput.files[0])

    console.log(formData);


    await fetch("http://localhost:3000/detect", {
        method: "POST",
        body: formData,
    })
    return false
}
fileInput.addEventListener("change", handleSubmit)