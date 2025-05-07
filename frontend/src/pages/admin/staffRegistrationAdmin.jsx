import React from "react"
import StaffRegistrationForm from "../../components/StaffRegister"
import SidebarNav from "../../components/sidebarNav"
import Header from "../../components/header"
import { useSelector } from "react-redux"

function StaffRegistrationAdmin () {
    const position = useSelector((state)=> state.auth.position)

    return (
        <>
        <StaffRegistrationForm />
        </>
    )
}

export default StaffRegistrationAdmin